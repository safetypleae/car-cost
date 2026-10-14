import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import proj4 from "proj4";
import { fetchCachedJson } from "@/lib/server/externalApiCache";

const NAVER_CLIENT_ID = process.env.NAVER_MAPS_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;
const OPINET_API_KEY = process.env.OPINET_API_KEY;

const PRODUCT_CODES = {
  gasoline: "B027",
  diesel: "D047",
  premium: "B034",
  lpg: "K015",
} as const;

type FuelType = keyof typeof PRODUCT_CODES;
type Coordinate = { lat: number; lng: number };
type Point = [number, number];
type RouteSummary = {
  distanceKm: number;
  durationMinutes: number;
  tollFee: number;
  path: Point[];
};

type RequestBody = {
  origin?: Coordinate & { name?: string };
  destination?: Coordinate & { name?: string };
  roundTrip?: boolean;
  efficiency?: number;
  fuelPrice?: number;
  fuelType?: FuelType;
  fillLiters?: number;
};

type OpinetAroundStation = {
  UNI_ID?: string;
  POLL_DIV_CD?: string;
  OS_NM?: string;
  PRICE?: string | number;
  GIS_X_COOR?: string | number;
  GIS_Y_COOR?: string | number;
};

type OpinetDetail = {
  UNI_ID?: string;
  VAN_ADR?: string;
  NEW_ADR?: string;
  TEL?: string;
};

type NaverResponse = {
  code?: number;
  message?: string;
  route?: {
    traoptimal?: Array<{
      summary?: { distance?: number; duration?: number; tollFare?: number };
      path?: Point[];
    }>;
  };
};

const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";
const KATEC =
  "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 " +
  "+ellps=bessel +towgs84=-146.43,507.89,681.46 +units=m +no_defs";

const MAX_SEARCH_POINTS = 4;
const MAX_DIRECTION_CANDIDATES = 5;
const SEARCH_RADIUS_METERS = 5000;
const MAX_ROUTE_DISTANCE_KM = 4;
const MAX_REQUEST_BYTES = 8 * 1024;
const LOCAL_ACTOR_LIMIT = 12;
const LOCAL_GLOBAL_LIMIT = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitBinding = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

type RouteFuelCloudflareEnv = CloudflareEnv & {
  ROUTE_FUEL_RATE_LIMITER?: RateLimitBinding;
  ROUTE_FUEL_GLOBAL_RATE_LIMITER?: RateLimitBinding;
};

type LocalRateLimitEntry = { count: number; resetAt: number };
const localActorLimits = new Map<string, LocalRateLimitEntry>();
let localGlobalLimit: LocalRateLimitEntry = { count: 0, resetAt: 0 };

function takeLocalToken(store: Map<string, LocalRateLimitEntry>, key: string, limit: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function takeLocalGlobalToken() {
  const now = Date.now();
  if (localGlobalLimit.resetAt <= now) {
    localGlobalLimit = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    return true;
  }
  if (localGlobalLimit.count >= LOCAL_GLOBAL_LIMIT) return false;
  localGlobalLimit.count += 1;
  return true;
}

async function rateLimitKey(request: NextRequest) {
  const forwarded = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";
  const data = new TextEncoder().encode(`${forwarded}:${userAgent}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function allowRequest(request: NextRequest) {
  const actorKey = await rateLimitKey(request);
  // OpenNext exposes its request-scoped context through this symbol in Workers.
  // Checking it first avoids starting Wrangler's development proxy under plain `next dev/start`.
  const hasCloudflareContext = Reflect.get(globalThis, Symbol.for("__cloudflare-context__"));
  if (hasCloudflareContext) {
    const { env } = getCloudflareContext();
    const bindings = env as RouteFuelCloudflareEnv;
    if (bindings.ROUTE_FUEL_RATE_LIMITER && bindings.ROUTE_FUEL_GLOBAL_RATE_LIMITER) {
      const [actor, global] = await Promise.all([
        bindings.ROUTE_FUEL_RATE_LIMITER.limit({ key: actorKey }),
        bindings.ROUTE_FUEL_GLOBAL_RATE_LIMITER.limit({ key: "route-fuel-stations" }),
      ]);
      return actor.success && global.success;
    }
  }
  return takeLocalToken(localActorLimits, actorKey, LOCAL_ACTOR_LIMIT) && takeLocalGlobalToken();
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function cacheIdentity(url: URL, secretParameter?: string) {
  const safeUrl = new URL(url);
  if (secretParameter) safeUrl.searchParams.delete(secretParameter);
  return `${safeUrl.pathname}?${safeUrl.searchParams.toString()}`;
}

function validCoordinate(point: Coordinate | undefined): point is Coordinate {
  return Boolean(point) && Number.isFinite(point?.lat) && Number.isFinite(point?.lng) &&
    point!.lat >= 32 && point!.lat <= 40 && point!.lng >= 124 && point!.lng <= 132;
}

function toKatec(point: Coordinate) {
  const [x, y] = proj4(WGS84, KATEC, [point.lng, point.lat]);
  return { x: Math.round(x), y: Math.round(y) };
}

function toWgs84(x: number, y: number): Coordinate | null {
  const [lng, lat] = proj4(KATEC, WGS84, [x, y]);
  const point = { lat, lng };
  return validCoordinate(point) ? point : null;
}

function haversineKm(a: Coordinate, b: Coordinate) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceToPathKm(point: Coordinate, path: Point[]) {
  if (!path.length) return Number.POSITIVE_INFINITY;
  // Directions paths are dense. Point-to-vertex distance is a safe, inexpensive first-pass filter.
  let minimum = Number.POSITIVE_INFINITY;
  const step = Math.max(1, Math.floor(path.length / 500));
  for (let index = 0; index < path.length; index += step) {
    const [lng, lat] = path[index];
    minimum = Math.min(minimum, haversineKm(point, { lat, lng }));
  }
  return minimum;
}

function samplePath(path: Point[]) {
  const ratios = [0.1, 0.35, 0.65, 0.9].slice(0, MAX_SEARCH_POINTS);
  return ratios.map((ratio) => {
    const [lng, lat] = path[Math.min(path.length - 1, Math.round((path.length - 1) * ratio))];
    return { lat, lng };
  });
}

async function getDirections(start: Coordinate, goal: Coordinate, waypoint?: Coordinate) {
  const url = new URL("https://maps.apigw.ntruss.com/map-direction/v1/driving");
  url.searchParams.set("start", `${start.lng},${start.lat}`);
  url.searchParams.set("goal", `${goal.lng},${goal.lat}`);
  if (waypoint) url.searchParams.set("waypoints", `${waypoint.lng},${waypoint.lat}`);
  url.searchParams.set("option", "traoptimal");

  const data = await fetchCachedJson<NaverResponse>({
    namespace: "naver-directions-v1",
    identity: cacheIdentity(url),
    ttlSeconds: 300,
    fetcher: () => fetch(url, {
      headers: {
        "x-ncp-apigw-api-key-id": NAVER_CLIENT_ID!,
        "x-ncp-apigw-api-key": NAVER_CLIENT_SECRET!,
      },
      cache: "no-store",
    }),
  });
  const route = data.route?.traoptimal?.[0];
  const summary = route?.summary;
  if (data.code !== 0 || !summary || !Number.isFinite(summary.distance) ||
      !Number.isFinite(summary.duration) || !Number.isFinite(summary.tollFare)) {
    throw new Error(data.message || "자동차 경로를 찾을 수 없습니다.");
  }
  return {
    distanceKm: summary.distance! / 1000,
    durationMinutes: Math.round(summary.duration! / 60000),
    tollFee: summary.tollFare!,
    path: Array.isArray(route.path) ? route.path : [],
  } satisfies RouteSummary;
}

async function searchAround(point: Coordinate, fuelType: FuelType) {
  const katec = toKatec(point);
  const url = new URL("https://www.opinet.co.kr/api/aroundAll.do");
  url.searchParams.set("certkey", OPINET_API_KEY!);
  url.searchParams.set("x", String(katec.x));
  url.searchParams.set("y", String(katec.y));
  url.searchParams.set("radius", String(SEARCH_RADIUS_METERS));
  url.searchParams.set("sort", "1");
  url.searchParams.set("prodcd", PRODUCT_CODES[fuelType]);
  url.searchParams.set("out", "json");

  const data = await fetchCachedJson<{ RESULT?: { OIL?: OpinetAroundStation[] } }>({
    namespace: "opinet-around-v1",
    identity: cacheIdentity(url, "certkey"),
    ttlSeconds: 1800,
    fetcher: () => fetch(url, { cache: "no-store" }),
  });
  return data.RESULT?.OIL ?? [];
}

async function getStationDetail(id: string) {
  const url = new URL("https://www.opinet.co.kr/api/detailById.do");
  url.searchParams.set("certkey", OPINET_API_KEY!);
  url.searchParams.set("id", id);
  url.searchParams.set("out", "json");
  try {
    const data = await fetchCachedJson<{ RESULT?: { OIL?: OpinetDetail[] } }>({
      namespace: "opinet-detail-v1",
      identity: cacheIdentity(url, "certkey"),
      ttlSeconds: 3600,
      fetcher: () => fetch(url, { cache: "no-store" }),
    });
    return data.RESULT?.OIL?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
    }
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "요청 데이터가 너무 큽니다." }, { status: 413 });
    }
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "JSON 요청만 지원합니다." }, { status: 415 });
    }
    if (!(await allowRequest(request))) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, {
        status: 429,
        headers: { "Cache-Control": "private, no-store", "Retry-After": "60" },
      });
    }
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !OPINET_API_KEY) {
      return NextResponse.json({ error: "주유소 추천 서비스 인증정보가 설정되지 않았습니다." }, { status: 503 });
    }

    const body = await request.json() as RequestBody;
    const { origin, destination, roundTrip = false, fuelType, efficiency, fuelPrice, fillLiters } = body;
    if (!validCoordinate(origin) || !validCoordinate(destination)) {
      return NextResponse.json({ error: "출발지와 목적지 좌표가 올바르지 않습니다." }, { status: 400 });
    }
    if (!fuelType || !(fuelType in PRODUCT_CODES)) {
      return NextResponse.json({ error: "지원하지 않는 유종입니다." }, { status: 400 });
    }
    if (!Number.isFinite(efficiency) || efficiency! <= 0 || !Number.isFinite(fuelPrice) || fuelPrice! <= 0) {
      return NextResponse.json({ error: "동일 유종의 기준 유가와 차량 연비가 필요합니다." }, { status: 400 });
    }
    if (!Number.isFinite(fillLiters) || fillLiters! <= 0 || fillLiters! > 200) {
      return NextResponse.json({ error: "예상 주유량을 0L 초과 200L 이하로 입력해주세요." }, { status: 400 });
    }

    const [outbound, returning] = await Promise.all([
      getDirections(origin, destination),
      roundTrip ? getDirections(destination, origin) : Promise.resolve(null),
    ]);
    if (outbound.path.length < 2) {
      return NextResponse.json({ error: "경로 주변을 검색할 수 있는 좌표가 제공되지 않았습니다." }, { status: 502 });
    }

    const searches = await Promise.allSettled(samplePath(outbound.path).map((point) => searchAround(point, fuelType)));
    const unique = new Map<string, {
      id: string; name: string; brand: string; price: number; lat: number; lng: number; routeDistanceKm: number;
    }>();
    for (const result of searches) {
      if (result.status !== "fulfilled") continue;
      for (const raw of result.value) {
        const id = raw.UNI_ID?.trim();
        const price = Number(raw.PRICE);
        const x = Number(raw.GIS_X_COOR);
        const y = Number(raw.GIS_Y_COOR);
        const coordinate = Number.isFinite(x) && Number.isFinite(y) ? toWgs84(x, y) : null;
        if (!id || !coordinate || !Number.isFinite(price) || price <= 0) continue;
        const routeDistanceKm = distanceToPathKm(coordinate, outbound.path);
        if (routeDistanceKm > MAX_ROUTE_DISTANCE_KM) continue;
        const existing = unique.get(id);
        if (!existing || price < existing.price) {
          unique.set(id, {
            id,
            name: raw.OS_NM?.trim() || "주유소",
            brand: raw.POLL_DIV_CD?.trim() || "",
            price,
            lat: coordinate.lat,
            lng: coordinate.lng,
            routeDistanceKm,
          });
        }
      }
    }

    if (!unique.size) {
      return NextResponse.json({
        source: "Opinet",
        fetchedAt: new Date().toISOString(),
        searchedPoints: searches.length,
        verifiedCandidates: 0,
        recommendations: [],
        message: searches.every((item) => item.status === "rejected")
          ? "오피넷 조회에 실패했습니다. 잠시 후 다시 시도해주세요."
          : "검색한 경로 주변에서 해당 유종의 가격 정보를 찾지 못했습니다.",
      });
    }

    const baselineDistanceKm = outbound.distanceKm + (returning?.distanceKm ?? 0);
    const baselineDurationMinutes = outbound.durationMinutes + (returning?.durationMinutes ?? 0);
    const baselineTollFee = outbound.tollFee + (returning?.tollFee ?? 0);
    const shortlist = [...unique.values()]
      .sort((a, b) => {
        const aEstimate = (fuelPrice! - a.price) * fillLiters! - a.routeDistanceKm * 2 / efficiency! * fuelPrice!;
        const bEstimate = (fuelPrice! - b.price) * fillLiters! - b.routeDistanceKm * 2 / efficiency! * fuelPrice!;
        return bEstimate - aEstimate;
      })
      .slice(0, MAX_DIRECTION_CANDIDATES);

    const detours = await Promise.allSettled(
      shortlist.map((station) => getDirections(origin, destination, station))
    );

    const ranked = shortlist.flatMap((station, index) => {
      const detour = detours[index];
      if (detour.status !== "fulfilled") return [];
      const totalDistanceKm = detour.value.distanceKm + (returning?.distanceKm ?? 0);
      const totalDurationMinutes = detour.value.durationMinutes + (returning?.durationMinutes ?? 0);
      const totalTollFee = detour.value.tollFee + (returning?.tollFee ?? 0);
      const distanceDifferenceKm = totalDistanceKm - baselineDistanceKm;
      const durationDifferenceMinutes = totalDurationMinutes - baselineDurationMinutes;
      const tollDifference = totalTollFee - baselineTollFee;
      const routeFuelDifference = distanceDifferenceKm / efficiency! * fuelPrice!;
      const additionalFuelCost = Math.max(0, routeFuelDifference);
      const fuelSavings = (fuelPrice! - station.price) * fillLiters!;
      const netSavings = fuelSavings - routeFuelDifference - tollDifference;

      return [{
        ...station,
        fillLiters,
        distanceDifferenceKm,
        durationDifferenceMinutes,
        additionalFuelCost,
        routeFuelDifference,
        tollDifference,
        fuelSavings,
        netSavings,
        path: detour.value.path,
      }];
    }).filter((station) => station.netSavings > 0)
      .sort((a, b) => b.netSavings - a.netSavings)
      .slice(0, 3);

    // Detailed Opinet calls are limited to the final TOP 3, rather than every route candidate.
    const details = await Promise.all(ranked.map((station) => getStationDetail(station.id)));
    const recommendations = ranked.map((station, index) => ({
      ...station,
      address: details[index]?.NEW_ADR?.trim() || details[index]?.VAN_ADR?.trim() || "주소 정보 없음",
      phone: details[index]?.TEL?.trim() || "",
    }));

    return NextResponse.json({
      source: "Opinet",
      fetchedAt: new Date().toISOString(),
      fuelType,
      referencePrice: fuelPrice,
      searchedPoints: searches.length,
      candidateLimit: MAX_DIRECTION_CANDIDATES,
      verifiedCandidates: detours.filter((item) => item.status === "fulfilled").length,
      baseline: {
        distanceKm: baselineDistanceKm,
        durationMinutes: baselineDurationMinutes,
        tollFee: baselineTollFee,
      },
      mapClientId: NAVER_CLIENT_ID,
      recommendations,
      message: recommendations.length ? undefined : "검증한 후보 중 실질 절약액이 0원보다 큰 주유소가 없습니다.",
      scopeNotice: "경로 주변 표본 지점에서 찾은 후보 중 최대 5곳을 실제 경유 경로로 검증한 결과입니다.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Route fuel station search failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "주유소 추천 중 오류가 발생했습니다.",
    }, { status: 502 });
  }
}
