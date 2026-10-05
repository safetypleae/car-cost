import { NextRequest, NextResponse } from "next/server";
import proj4 from "proj4";

const OPINET_API_KEY = process.env.OPINET_API_KEY;

type FuelType = "gasoline" | "diesel" | "premium" | "lpg";

type OpinetStation = {
  UNI_ID?: string;
  POLL_DIV_CD?: string;
  OS_NM?: string;
  PRICE?: string | number;
  DISTANCE?: string | number;
  GIS_X_COOR?: string | number;
  GIS_Y_COOR?: string | number;
};

type OpinetResponse = {
  RESULT?: {
    OIL?: OpinetStation[];
  };
};

const PRODUCT_CODES: Record<FuelType, string> = {
  gasoline: "B027",
  diesel: "D047",
  premium: "B034",
  lpg: "K015",
};

/*
 * Kakao Local API에서 받는 좌표계
 * WGS84 경도 / 위도
 */
const WGS84 =
  "+proj=longlat +datum=WGS84 +no_defs";

/*
 * Opinet 반경검색 API에서 사용하는 KATEC 좌표계
 */
const KATEC =
  "+proj=tmerc " +
  "+lat_0=38 " +
  "+lon_0=128 " +
  "+k=0.9999 " +
  "+x_0=400000 " +
  "+y_0=600000 " +
  "+ellps=bessel " +
  "+towgs84=-146.43,507.89,681.46 " +
  "+units=m " +
  "+no_defs";

function convertToKatec(lng: number, lat: number) {
  const [x, y] = proj4(WGS84, KATEC, [
    lng,
    lat,
  ]);

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

export async function GET(request: NextRequest) {
  try {
    /*
     * 1. Opinet API KEY 확인
     */
    if (!OPINET_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Opinet API 인증정보가 설정되지 않았습니다.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 2. 요청 파라미터
     */
    const searchParams =
      request.nextUrl.searchParams;

    const lng = Number(
      searchParams.get("lng")
    );

    const lat = Number(
      searchParams.get("lat")
    );

    const requestedFuel =
      searchParams.get("fuel") ?? "gasoline";

    /*
     * 3. 좌표 검증
     */
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat)
    ) {
      return NextResponse.json(
        {
          error:
            "올바른 경도(lng)와 위도(lat)가 필요합니다.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 대한민국 영역을 크게 벗어난 좌표 방지
     */
    if (
      lng < 124 ||
      lng > 132 ||
      lat < 33 ||
      lat > 39
    ) {
      return NextResponse.json(
        {
          error:
            "국내에서 사용할 수 있는 좌표가 아닙니다.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 4. 연료 종류 검증
     */
    if (!(requestedFuel in PRODUCT_CODES)) {
      return NextResponse.json(
        {
          error:
            "지원하지 않는 연료 종류입니다.",
        },
        {
          status: 400,
        }
      );
    }

    const fuel =
      requestedFuel as FuelType;

    /*
     * 5. WGS84 → KATEC
     */
    const katec = convertToKatec(lng, lat);

    /*
     * 6. Opinet API URL 생성
     */
    const url = new URL(
      "https://www.opinet.co.kr/api/aroundAll.do"
    );

    url.searchParams.set(
      "certkey",
      OPINET_API_KEY
    );

    url.searchParams.set(
      "x",
      String(katec.x)
    );

    url.searchParams.set(
      "y",
      String(katec.y)
    );

    /*
     * 출발지 반경 5km
     */
    url.searchParams.set("radius", "5000");

    /*
     * 1 = 가격순
     */
    url.searchParams.set("sort", "1");

    url.searchParams.set(
      "prodcd",
      PRODUCT_CODES[fuel]
    );

    url.searchParams.set("out", "json");

    /*
     * 7. Opinet 호출
     */
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Opinet API 오류: ${response.status} ${errorText}`
      );
    }

    const data =
      (await response.json()) as OpinetResponse;

    /*
     * 8. 차비얼마에서 사용할 데이터만 정리
     */
    const stations =
      (data.RESULT?.OIL ?? [])
        .map((station) => ({
          id: station.UNI_ID ?? "",

          name:
            station.OS_NM?.trim() ||
            "주유소",

          brand:
            station.POLL_DIV_CD ?? "",

          price: Number(station.PRICE),

          distance: Number(
            station.DISTANCE
          ),

          x: Number(
            station.GIS_X_COOR
          ),

          y: Number(
            station.GIS_Y_COOR
          ),
        }))
        .filter(
          (station) =>
            Number.isFinite(
              station.price
            ) &&
            station.price > 0 &&
            Number.isFinite(
              station.distance
            ) &&
            station.distance >= 0
        );

    /*
     * 9. 검색 결과 없음
     */
    if (stations.length === 0) {
      return NextResponse.json(
        {
          error:
            "출발지 주변에서 유가 정보를 찾지 못했습니다.",

          input: {
            lng,
            lat,
          },

          katec,

          debug: {
            fuel,
            productCode:
              PRODUCT_CODES[fuel],
            stationCount: 0,
          },
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 10. 평균 유가
     */
    const totalPrice =
      stations.reduce(
        (sum, station) =>
          sum + station.price,
        0
      );

    const averagePrice = Math.round(
      totalPrice / stations.length
    );

    /*
     * 11. 최저가 계산
     */
    const lowestPrice = Math.min(
      ...stations.map(
        (station) => station.price
      )
    );

    /*
     * 동일한 최저가 주유소가 여러 곳이면
     * 출발지에서 가장 가까운 곳을 선택
     */
    const lowestStation =
      stations
        .filter(
          (station) =>
            station.price === lowestPrice
        )
        .sort(
          (a, b) =>
            a.distance - b.distance
        )[0];

    /*
     * 12. 거리 기준 가장 가까운 주유소
     *
     * 추후 UI 확장 시 사용할 수 있도록
     * API 응답에는 함께 제공
     */
    const nearestStation =
      [...stations].sort(
        (a, b) =>
          a.distance - b.distance
      )[0];

    /*
     * 13. 결과 반환
     */
    return NextResponse.json({
      fuel,

      source: "Opinet",

      radiusKm: 5,

      input: {
        lng,
        lat,
      },

      katec,

      stationCount:
        stations.length,

      averagePrice,

      /*
       * 최저가 + 동일 가격이면 최단거리
       */
      lowest: {
        name:
          lowestStation.name,

        price:
          lowestStation.price,

        distance:
          lowestStation.distance,
      },

      /*
       * 가장 가까운 주유소
       * 현재 UI에서는 사용하지 않아도 됨
       */
      nearest: {
        name:
          nearestStation.name,

        price:
          nearestStation.price,

        distance:
          nearestStation.distance,
      },

      stations,
    });
  } catch (error) {
    console.error(
      "Opinet fuel API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "유가 조회 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}