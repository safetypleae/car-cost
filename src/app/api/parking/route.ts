import { NextRequest, NextResponse } from "next/server";

type KakaoParking = {
  id: string;
  place_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
};

export async function GET(request: NextRequest) {
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) {
    return NextResponse.json(
      { error: "Kakao API 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "목적지 좌표가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      category_group_code: "PK6",
      x: String(lng),
      y: String(lat),
      radius: "3000",
      sort: "distance",
      size: "6",
    });

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params.toString()}`,
      {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error("주변 주차장 검색에 실패했습니다.");
    }

    const data = await response.json();
    const documents = (Array.isArray(data.documents) ? data.documents : []) as KakaoParking[];

    const parkings = documents.map((place) => ({
      id: place.id,
      name: place.place_name,
      address: place.address_name || "",
      roadAddress: place.road_address_name || "",
      phone: place.phone || "",
      distanceMeters: Number(place.distance) || 0,
      lat: Number(place.y),
      lng: Number(place.x),
      kakaoUrl: place.place_url || "",
      feeInfo: "",
      basicTime: null,
      basicCharge: null,
      addUnitTime: null,
      addUnitCharge: null,
      dayTicket: null,
      referenceDate: "",
      officialMatched: false,
    }));

    return NextResponse.json(
      { parkings, source: "Kakao Local" },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "주차장 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
