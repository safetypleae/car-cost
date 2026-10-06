import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_MAPS_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;

type GeocodingAddress = {
  x: string;
  y: string;
};

type GeocodingResponse = {
  addresses?: GeocodingAddress[];
};

type DirectionsSummary = {
  distance: number;
  duration: number;
  tollFare: number;
};

type DirectionsResponse = {
  code: number;
  message: string;
  route?: {
    traoptimal?: Array<{
      summary: DirectionsSummary;
    }>;
  };
};

async function geocode(address: string) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error("NAVER API 인증정보가 설정되지 않았습니다.");
  }

  const url = new URL(
    "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
  );

  url.searchParams.set("query", address);

  const response = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": NAVER_CLIENT_ID,
      "x-ncp-apigw-api-key": NAVER_CLIENT_SECRET,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Geocoding API 오류: ${response.status} ${errorText}`
    );
  }

  const data = (await response.json()) as GeocodingResponse;

  const firstAddress = data.addresses?.[0];

  if (!firstAddress) {
    throw new Error(`주소를 찾을 수 없습니다: ${address}`);
  }

  return {
    lng: Number(firstAddress.x),
    lat: Number(firstAddress.y),
  };
}

async function getDirections(
  start: { lng: number; lat: number },
  goal: { lng: number; lat: number }
) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error("NAVER API 인증정보가 설정되지 않았습니다.");
  }

  const url = new URL(
    "https://maps.apigw.ntruss.com/map-direction/v1/driving"
  );

  url.searchParams.set("start", `${start.lng},${start.lat}`);
  url.searchParams.set("goal", `${goal.lng},${goal.lat}`);
  url.searchParams.set("option", "traoptimal");

  const response = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": NAVER_CLIENT_ID,
      "x-ncp-apigw-api-key": NAVER_CLIENT_SECRET,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Directions API 오류: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as DirectionsResponse;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");

    if (!origin || !destination) {
      return NextResponse.json(
        {
          error: "출발지와 목적지를 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const originLat = Number(searchParams.get("originLat"));
    const originLng = Number(searchParams.get("originLng"));
    const destinationLat = Number(searchParams.get("destinationLat"));
    const destinationLng = Number(searchParams.get("destinationLng"));

    const hasOriginCoordinates = Number.isFinite(originLat) && Number.isFinite(originLng);
    const hasDestinationCoordinates = Number.isFinite(destinationLat) && Number.isFinite(destinationLng);

    const [start, goal] = await Promise.all([
      hasOriginCoordinates ? Promise.resolve({ lat: originLat, lng: originLng }) : geocode(origin),
      hasDestinationCoordinates
        ? Promise.resolve({ lat: destinationLat, lng: destinationLng })
        : geocode(destination),
    ]);

    const directions = await getDirections(start, goal);

    const summary = directions.route?.traoptimal?.[0]?.summary;

    if (!summary) {
      throw new Error(
        directions.message || "자동차 경로를 찾을 수 없습니다."
      );
    }

    return NextResponse.json({
      origin,
      destination,

      start,
      goal,

      distanceKm: Number((summary.distance / 1000).toFixed(1)),

      durationMinutes: Math.round(
        summary.duration / 1000 / 60
      ),

      tollFee: summary.tollFare,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "경로 조회 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
