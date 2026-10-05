import { NextRequest, NextResponse } from "next/server";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
};

type KakaoSearchResponse = {
  documents: KakaoPlace[];
};

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error: "검색어를 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    if (!KAKAO_REST_API_KEY) {
      return NextResponse.json(
        {
          error: "Kakao API 인증정보가 설정되지 않았습니다.",
        },
        {
          status: 500,
        }
      );
    }

    const url = new URL(
      "https://dapi.kakao.com/v2/local/search/keyword.json"
    );

    url.searchParams.set("query", query);
    url.searchParams.set("size", "5");

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Kakao 장소검색 API 오류: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as KakaoSearchResponse;

    const places = data.documents.map((place) => ({
      id: place.id,
      name: place.place_name,
      category: place.category_name,
      phone: place.phone,
      address: place.address_name,
      roadAddress: place.road_address_name,
      lng: Number(place.x),
      lat: Number(place.y),
      kakaoUrl: place.place_url,
    }));

    return NextResponse.json({
      query,
      count: places.length,
      places,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "장소 검색 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
