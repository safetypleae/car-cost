import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://apis.data.go.kr/B553530/CAREFF/CAREFF_LIST";

const API_PAGE_SIZE = 100;
const MAX_API_PAGES = 15;

type RawVehicle = {
  RANGE_PER_CHARGE?: string;
  DATA_REG_DT?: string;
  ESTIMATED_FUEL_COST?: string;
  URBAN_EFF?: string;
  CAR_KIND?: string;
  YEAR?: string;
  ENGINE_DISPLACEMENT?: string;
  MODEL_NM?: string;
  CAR_TYPE?: string;
  FUEL_NM?: string;
  GRADE?: string;
  GEAR_TYPE?: string;
  COMP_NM?: string;
  HIGHWAY_EFF?: string;
  DISPLAY_EFF?: string;
  CO2_OUTPUT?: string;
};

type PublicApiResponse = {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      pageNo?: string;
      totalCount?: string;
      numOfRows?: string;
      items?: {
        item?: RawVehicle[] | RawVehicle;
      };
    };
  };
};

type FuelCategory =
  | "gasoline"
  | "diesel"
  | "lpg"
  | "electric"
  | "hydrogen"
  | "other";

type Vehicle = {
  id: string;
  manufacturer: string;
  model: string;
  year: number | null;
  fuel: string | null;
  fuelCategory: FuelCategory;
  efficiency: number | null;
  urbanEfficiency: number | null;
  highwayEfficiency: number | null;
  displacement: number | null;
  grade: string | null;
  transmission: string | null;
  carKind: string | null;
  carType: string | null;
  co2: number | null;
  rangePerCharge: number | null;
  supported: boolean;
};

function normalizeText(
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.toUpperCase() === "NULL"
  ) {
    return null;
  }

  return trimmed;
}

function normalizeNumber(
  value: string | undefined
): number | null {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}

function getFuelCategory(
  fuelName: string | null
): FuelCategory {
  if (!fuelName) {
    return "other";
  }

  const fuel = fuelName
    .toLowerCase()
    .replace(/\s+/g, "");

  /*
   * 하이브리드는 연료명이
   * "휘발유 하이브리드"처럼 들어와도
   * 실제 유류비 계산은 휘발유 기준으로 가능하다.
   */
  if (
    fuel.includes("휘발유") ||
    fuel.includes("가솔린")
  ) {
    return "gasoline";
  }

  if (
    fuel.includes("경유") ||
    fuel.includes("디젤")
  ) {
    return "diesel";
  }

  if (fuel.includes("lpg")) {
    return "lpg";
  }

  if (
    fuel.includes("전기") ||
    fuel === "ev"
  ) {
    return "electric";
  }

  if (
    fuel.includes("수소") ||
    fuel.includes("fuelcell")
  ) {
    return "hydrogen";
  }

  return "other";
}

function createVehicle(
  raw: RawVehicle,
  index: number
): Vehicle | null {
  const manufacturer =
    normalizeText(raw.COMP_NM);

  const model =
    normalizeText(raw.MODEL_NM);

  if (!manufacturer || !model) {
    return null;
  }

  const year =
    normalizeNumber(raw.YEAR);

  const fuel =
    normalizeText(raw.FUEL_NM);

  const fuelCategory =
    getFuelCategory(fuel);

  const supported =
    fuelCategory === "gasoline" ||
    fuelCategory === "diesel" ||
    fuelCategory === "lpg";

  const efficiency =
    normalizeNumber(raw.DISPLAY_EFF);

  const displacement =
    normalizeNumber(
      raw.ENGINE_DISPLACEMENT
    );

  const transmission =
    normalizeText(raw.GEAR_TYPE);

  const id = [
    manufacturer,
    model,
    year ?? "unknown",
    fuel ?? "unknown",
    displacement ?? "unknown",
    transmission ?? "unknown",
    index,
  ].join("-");

  return {
    id,
    manufacturer,
    model,
    year,
    fuel,
    fuelCategory,
    efficiency,

    urbanEfficiency:
      normalizeNumber(raw.URBAN_EFF),

    highwayEfficiency:
      normalizeNumber(
        raw.HIGHWAY_EFF
      ),

    displacement,

    grade:
      normalizeText(raw.GRADE),

    transmission,

    carKind:
      normalizeText(raw.CAR_KIND),

    carType:
      normalizeText(raw.CAR_TYPE),

    co2:
      normalizeNumber(raw.CO2_OUTPUT),

    rangePerCharge:
      normalizeNumber(
        raw.RANGE_PER_CHARGE
      ),

    supported,
  };
}

async function fetchApiPage({
  serviceKey,
  pageNo,
  manufacturer,
  model,
  year,
}: {
  serviceKey: string;
  pageNo: number;
  manufacturer: string;
  model: string;
  year: string;
}) {
  const params = new URLSearchParams();

  params.set("serviceKey", serviceKey);
  params.set(
    "pageNo",
    String(pageNo)
  );
  params.set(
    "numOfRows",
    String(API_PAGE_SIZE)
  );
  params.set("apiType", "json");

  /*
   * 공공데이터 API의 검색 기능을 먼저 이용해서
   * 원본 조회 범위를 최대한 줄인다.
   */
  if (manufacturer) {
    params.set("q1", manufacturer);
  }

  if (model) {
    params.set("q2", model);
  }

  if (year) {
    params.set("q4", year);
  }

  const response = await fetch(
    `${API_URL}?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  const rawText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      "자동차 연비 API 요청에 실패했습니다."
    );
  }

  let data: PublicApiResponse;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      "자동차 연비 API 응답을 처리하지 못했습니다."
    );
  }

  const header =
    data.response?.header;

  if (
    header?.resultCode &&
    header.resultCode !== "00"
  ) {
    throw new Error(
      header.resultMsg ||
        "자동차 연비 API에서 오류를 반환했습니다."
    );
  }

  const body =
    data.response?.body;

  const rawItems =
    body?.items?.item ?? [];

  const items =
    Array.isArray(rawItems)
      ? rawItems
      : [rawItems];

  return {
    items,
    totalCount: Number(
      body?.totalCount || 0
    ),
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const serviceKey =
      process.env.CAR_FUEL_API_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        {
          error:
            "CAR_FUEL_API_KEY 환경변수가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    const manufacturer =
      searchParams
        .get("manufacturer")
        ?.trim() ?? "";

    const model =
      searchParams
        .get("model")
        ?.trim() ?? "";

    const year =
      searchParams
        .get("year")
        ?.trim() ?? "";

    const includeUnsupported =
      searchParams.get(
        "includeUnsupported"
      ) === "true";

    /*
     * 검색조건 없이 3,700여 건을 매번 가져오는
     * 요청은 허용하지 않는다.
     */
    if (
      !manufacturer &&
      !model &&
      !year
    ) {
      return NextResponse.json(
        {
          error:
            "manufacturer, model, year 중 하나 이상의 검색조건이 필요합니다.",
        },
        { status: 400 }
      );
    }

    const firstPage =
      await fetchApiPage({
        serviceKey,
        pageNo: 1,
        manufacturer,
        model,
        year,
      });

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          firstPage.totalCount /
            API_PAGE_SIZE
        )
      );

    /*
     * 한 번의 사용자 검색 때문에 지나치게 많은
     * 공공 API 호출이 발생하지 않도록 제한한다.
     *
     * 현재 현대 검색처럼 1,000건대 결과도
     * 최대 15페이지 안에서 처리 가능하다.
     */
    const pagesToFetch =
      Math.min(
        totalPages,
        MAX_API_PAGES
      );

    let allRawItems =
      [...firstPage.items];

    if (pagesToFetch > 1) {
      const pageNumbers =
        Array.from(
          {
            length:
              pagesToFetch - 1,
          },
          (_, index) =>
            index + 2
        );

      /*
       * 공공 API에 너무 많은 동시 요청을 보내지 않도록
       * 3페이지씩 나눠서 요청한다.
       */
      for (
        let i = 0;
        i < pageNumbers.length;
        i += 3
      ) {
        const batch =
          pageNumbers.slice(
            i,
            i + 3
          );

        const results =
          await Promise.all(
            batch.map((pageNo) =>
              fetchApiPage({
                serviceKey,
                pageNo,
                manufacturer,
                model,
                year,
              })
            )
          );

        for (const result of results) {
          allRawItems.push(
            ...result.items
          );
        }
      }
    }

    let vehicles =
      allRawItems
        .map((raw, index) =>
          createVehicle(
            raw,
            index
          )
        )
        .filter(
          (
            vehicle
          ): vehicle is Vehicle =>
            vehicle !== null
        );

    /*
     * 중요:
     *
     * 공공 API q1 검색은 "현대" 검색 시
     * "북경현대기차유한공사"까지 포함한다.
     *
     * 따라서 제조사가 지정됐을 때는
     * 우리 서버에서 다시 정확히 일치시킨다.
     */
    if (manufacturer) {
      const exactManufacturer =
        manufacturer.toLowerCase();

      vehicles =
        vehicles.filter(
          (vehicle) =>
            vehicle.manufacturer
              .toLowerCase() ===
            exactManufacturer
        );
    }

    /*
     * 모델명도 사용자가 검색한 문자열이 실제 모델명에
     * 포함되는지 한 번 더 확인한다.
     */
    if (model) {
      const normalizedModel =
        model.toLowerCase();

      vehicles =
        vehicles.filter(
          (vehicle) =>
            vehicle.model
              .toLowerCase()
              .includes(
                normalizedModel
              )
        );
    }

    if (year) {
      const targetYear =
        Number(year);

      if (
        Number.isFinite(
          targetYear
        )
      ) {
        vehicles =
          vehicles.filter(
            (vehicle) =>
              vehicle.year ===
              targetYear
          );
      }
    }

    /*
     * 현재 차비얼마 계산식은
     * 원/L 기반 차량을 우선 지원한다.
     */
    if (!includeUnsupported) {
      vehicles =
        vehicles.filter(
          (vehicle) =>
            vehicle.supported &&
            vehicle.efficiency !==
              null &&
            vehicle.efficiency > 0
        );
    }

    /*
     * 최신 연식 우선 → 모델명 순으로 정렬.
     */
    vehicles.sort((a, b) => {
      const yearA =
        a.year ?? 0;

      const yearB =
        b.year ?? 0;

      if (yearA !== yearB) {
        return yearB - yearA;
      }

      return a.model.localeCompare(
        b.model,
        "ko"
      );
    });

    /*
     * 완전히 동일한 중복 행 제거.
     */
    const seen =
      new Set<string>();

    vehicles =
      vehicles.filter(
        (vehicle) => {
          const key = [
            vehicle.manufacturer,
            vehicle.model,
            vehicle.year,
            vehicle.fuel,
            vehicle.efficiency,
            vehicle.displacement,
            vehicle.transmission,
          ].join("|");

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);

          return true;
        }
      );

    return NextResponse.json(
      {
        query: {
          manufacturer:
            manufacturer || null,

          model:
            model || null,

          year:
            year || null,
        },

        sourceTotalCount:
          firstPage.totalCount,

        scannedCount:
          allRawItems.length,

        count:
          vehicles.length,

        truncated:
          totalPages >
          MAX_API_PAGES,

        vehicles,
      },
      {
        headers: {
          /*
           * 차량 공인연비 데이터는 실시간으로
           * 수시 변하는 정보가 아니므로 캐시한다.
           */
          "Cache-Control":
            "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error(
      "Vehicle API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "자동차 연비 정보를 불러오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}