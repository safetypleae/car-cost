import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_MAPS_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;

const OPTIONS = ["traoptimal", "trafast", "traavoidtoll"] as const;
type RouteOption = (typeof OPTIONS)[number];
type Coordinate = { lat: number; lng: number };
type RouteDetail = {
  distanceKm: number;
  durationMinutes: number;
  tollFee: number;
  path: [number, number][];
};

type NaverRoute = {
  summary?: { distance?: number; duration?: number; tollFare?: number };
  path?: [number, number][];
};
type NaverResponse = {
  code?: number;
  message?: string;
  route?: Partial<Record<RouteOption, NaverRoute[]>>;
};

function validCoordinate(point: Coordinate): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) &&
    point.lat >= 32 && point.lat <= 40 && point.lng >= 124 && point.lng <= 132;
}

async function requestOptions(start: Coordinate, goal: Coordinate) {
  const url = new URL("https://maps.apigw.ntruss.com/map-direction/v1/driving");
  url.searchParams.set("start", `${start.lng},${start.lat}`);
  url.searchParams.set("goal", `${goal.lng},${goal.lat}`);
  // Directions 5 supports up to three route options per request.
  url.searchParams.set("option", OPTIONS.join(":"));

  const response = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": NAVER_CLIENT_ID!,
      "x-ncp-apigw-api-key": NAVER_CLIENT_SECRET!,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Directions options HTTP status:", response.status);
    throw new Error("경로 비교 서비스를 일시적으로 이용할 수 없습니다.");
  }

  const data = (await response.json()) as NaverResponse;
  if (data.code !== 0 || !data.route) {
    console.error("Directions options error:", data.code, data.message);
    throw new Error("비교할 경로를 조회하지 못했습니다.");
  }

  const result: Partial<Record<RouteOption, RouteDetail>> = {};
  for (const option of OPTIONS) {
    const route = data.route[option]?.[0];
    const summary = route?.summary;
    if (!summary || !Number.isFinite(summary.distance) ||
        !Number.isFinite(summary.duration) || !Number.isFinite(summary.tollFare)) {
      continue;
    }
    result[option] = {
      distanceKm: Number((summary.distance! / 1000).toFixed(3)),
      durationMinutes: Math.round(summary.duration! / 60000),
      tollFee: summary.tollFare!,
      path: Array.isArray(route?.path) ? route.path : [],
    };
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return NextResponse.json({ error: "지도 서비스가 설정되지 않았습니다." }, { status: 503 });
    }

    const params = request.nextUrl.searchParams;
    const origin: Coordinate = {
      lat: Number(params.get("originLat")),
      lng: Number(params.get("originLng")),
    };
    const destination: Coordinate = {
      lat: Number(params.get("destinationLat")),
      lng: Number(params.get("destinationLng")),
    };

    if (!params.has("originLat") || !params.has("originLng") ||
        !params.has("destinationLat") || !params.has("destinationLng") ||
        !validCoordinate(origin) || !validCoordinate(destination)) {
      return NextResponse.json({ error: "출발지와 목적지 좌표가 올바르지 않습니다." }, { status: 400 });
    }

    const roundTrip = params.get("roundTrip") === "1";
    const [outbound, returning] = await Promise.all([
      requestOptions(origin, destination),
      roundTrip ? requestOptions(destination, origin) : Promise.resolve(null),
    ]);

    if (!Object.keys(outbound).length) {
      return NextResponse.json({ error: "비교할 수 있는 경로가 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      outbound,
      returning,
      mapClientId: NAVER_CLIENT_ID, // Public browser key, never the secret.
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Route comparison failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "경로 비교 중 오류가 발생했습니다.",
    }, { status: 502 });
  }
}
