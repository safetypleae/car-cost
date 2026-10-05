"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TripType = "oneway" | "roundtrip";
type FuelType = "gasoline" | "diesel" | "premium" | "lpg";

type Place = {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  roadAddress: string;
  lng: number;
  lat: number;
  kakaoUrl: string;
};

type Vehicle = {
  id: string;
  manufacturer: string;
  model: string;
  year: number | null;
  fuel: string | null;
  fuelCategory:
    | "gasoline"
    | "diesel"
    | "lpg"
    | "electric"
    | "hydrogen"
    | "other";
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

type RouteResult = {
  distanceKm: number;
  durationMinutes: number;
  tollFee: number;
};

type TripRouteResult = {
  outbound: RouteResult;
  returnRoute: RouteResult | null;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalTollFee: number;
};

type FuelResult = {
  fuel: FuelType;
  source: string;
  radiusKm: number;
  stationCount: number;
  averagePrice: number;
  lowest: {
    name: string;
    price: number;
    distance: number;
  };
  nearest?: {
    name: string;
    price: number;
    distance: number;
  };
};

type RecentCalculation = {
  id: string;
  savedAt: string;
  origin: Place;
  destination: Place;
  selectedVehicle: Vehicle | null;
  fuelType: FuelType;
  efficiency: string;
  fuelPrice: string;
  passengers: number;
  tripType: TripType;
  route: TripRouteResult;
  totalCost: number;
  costPerPerson: number;
};

const RECENT_CALCULATIONS_KEY = "car-cost-recent-calculations";
const MAX_RECENT_CALCULATIONS = 5;
const SHARE_QUERY_KEY = "share";

type SharedCalculation = {
  version: 1;
  origin: Place;
  destination: Place;
  selectedVehicle: Vehicle | null;
  fuelType: FuelType;
  efficiency: string;
  fuelPrice: string;
  passengers: number;
  tripType: TripType;
  route: TripRouteResult;
};

const FUEL_OPTIONS: Array<{
  value: FuelType;
  label: string;
}> = [
  { value: "gasoline", label: "휘발유" },
  { value: "diesel", label: "경유" },
  { value: "premium", label: "고급휘발유" },
  { value: "lpg", label: "LPG" },
];

const formatWon = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));

const formatDistance = (value: number) =>
  value.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
  });

const formatDuration = (minutes: number) => {
  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}분`;
  }

  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remainingMinutes}분`;
};

const formatDisplacement = (value: number | null) => {
  if (!value) {
    return null;
  }

  return `${value.toLocaleString("ko-KR")}cc`;
};

export default function Home() {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [fuelType, setFuelType] =
    useState<FuelType>("gasoline");

  const [efficiency, setEfficiency] = useState("12");
  const [fuelPrice, setFuelPrice] = useState("");

  const [fuelInfo, setFuelInfo] =
    useState<FuelResult | null>(null);

  const [fuelAutoError, setFuelAutoError] = useState("");

  const [passengers, setPassengers] = useState(1);

  const [tripType, setTripType] =
    useState<TripType>("oneway");

  const [route, setRoute] =
    useState<TripRouteResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [recentCalculations, setRecentCalculations] = useState<
    RecentCalculation[]
  >([]);
  const [recentLoaded, setRecentLoaded] = useState(false);

  const resetResult = () => {
    setRoute(null);
    setError("");
  };

  const resetFuel = () => {
    setFuelInfo(null);
    setFuelPrice("");
    setFuelAutoError("");
    resetResult();
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get(SHARE_QUERY_KEY);

      if (shared) {
        const parsed = JSON.parse(shared) as SharedCalculation;

        if (
          parsed.version === 1 &&
          parsed.origin?.id &&
          parsed.destination?.id &&
          parsed.route &&
          Number(parsed.efficiency) > 0 &&
          Number(parsed.fuelPrice) > 0 &&
          Number(parsed.passengers) > 0 &&
          (parsed.tripType === "oneway" ||
            parsed.tripType === "roundtrip")
        ) {
          setOrigin(parsed.origin);
          setDestination(parsed.destination);
          setSelectedVehicle(parsed.selectedVehicle ?? null);
          setFuelType(parsed.fuelType);
          setEfficiency(parsed.efficiency);
          setFuelPrice(parsed.fuelPrice);
          setPassengers(parsed.passengers);
          setTripType(parsed.tripType);
          setRoute(parsed.route);
          setFuelInfo(null);
          setFuelAutoError("");
          setError("");
          setShareStatus("공유받은 계산 결과를 불러왔습니다.");

          window.setTimeout(() => {
            document
              .getElementById("calculation-result")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }, 100);
        }
      }
    } catch {
      // 잘못되었거나 오래된 공유 링크는 무시하고 기본 화면을 표시합니다.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        RECENT_CALCULATIONS_KEY
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setRecentCalculations(
            parsed.slice(0, MAX_RECENT_CALCULATIONS)
          );
        }
      }
    } catch {
      window.localStorage.removeItem(RECENT_CALCULATIONS_KEY);
    } finally {
      setRecentLoaded(true);
    }
  }, []);

  const result = useMemo(() => {
    if (!route) {
      return null;
    }

    const fuelEfficiency = Number(efficiency);
    const pricePerLiter = Number(fuelPrice);

    if (
      fuelEfficiency <= 0 ||
      pricePerLiter <= 0 ||
      passengers <= 0
    ) {
      return null;
    }

    const fuelUsed =
      route.totalDistanceKm / fuelEfficiency;

    const fuelCost =
      fuelUsed * pricePerLiter;

    const totalCost =
      fuelCost + route.totalTollFee;

    const costPerPerson =
      totalCost / passengers;

    return {
      fuelUsed,
      fuelCost,
      totalCost,
      costPerPerson,
    };
  }, [route, efficiency, fuelPrice, passengers]);

  useEffect(() => {
    if (
      !recentLoaded ||
      !route ||
      !result ||
      !origin ||
      !destination ||
      Number(fuelPrice) <= 0
    ) {
      return;
    }

    const signature = [
      origin.id,
      destination.id,
      tripType,
      selectedVehicle?.id ?? "manual",
      fuelType,
      efficiency,
      fuelPrice,
      passengers,
    ].join("|");

    const recentItem: RecentCalculation = {
      id: signature,
      savedAt: new Date().toISOString(),
      origin,
      destination,
      selectedVehicle,
      fuelType,
      efficiency,
      fuelPrice,
      passengers,
      tripType,
      route,
      totalCost: result.totalCost,
      costPerPerson: result.costPerPerson,
    };

    setRecentCalculations((previous) => {
      const next = [
        recentItem,
        ...previous.filter((item) => item.id !== signature),
      ].slice(0, MAX_RECENT_CALCULATIONS);

      window.localStorage.setItem(
        RECENT_CALCULATIONS_KEY,
        JSON.stringify(next)
      );

      return next;
    });
  }, [
    recentLoaded,
    route,
    result,
    origin,
    destination,
    selectedVehicle,
    fuelType,
    efficiency,
    fuelPrice,
    passengers,
    tripType,
  ]);

  const loadRecentCalculation = (item: RecentCalculation) => {
    setOrigin(item.origin);
    setDestination(item.destination);
    setSelectedVehicle(item.selectedVehicle);
    setFuelType(item.fuelType);
    setEfficiency(item.efficiency);
    setFuelPrice(item.fuelPrice);
    setPassengers(item.passengers);
    setTripType(item.tripType);
    setFuelInfo(null);
    setFuelAutoError("");
    setError("");
    setRoute(item.route);

    window.setTimeout(() => {
      document
        .getElementById("calculation-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const deleteRecentCalculation = (id: string) => {
    setRecentCalculations((previous) => {
      const next = previous.filter((item) => item.id !== id);

      window.localStorage.setItem(
        RECENT_CALCULATIONS_KEY,
        JSON.stringify(next)
      );

      return next;
    });
  };

  const clearRecentCalculations = () => {
    setRecentCalculations([]);
    window.localStorage.removeItem(RECENT_CALCULATIONS_KEY);
  };

  const handleShare = async () => {
    if (!origin || !destination || !route || !result) {
      return;
    }

    const tripLabel = tripType === "roundtrip" ? "왕복" : "편도";
    const sharedCalculation: SharedCalculation = {
      version: 1,
      origin,
      destination,
      selectedVehicle,
      fuelType,
      efficiency,
      fuelPrice,
      passengers,
      tripType,
      route,
    };

    const shareUrl = new URL("https://car-cost.kr");
    shareUrl.searchParams.set(
      SHARE_QUERY_KEY,
      JSON.stringify(sharedCalculation)
    );

    const shareText = [
      "차비얼마 🚗",
      `${origin.name} → ${destination.name}`,
      `${tripLabel} · ${formatDistance(route.totalDistanceKm)}km`,
      `예상 차비 ${formatWon(result.totalCost)}원`,
      `${passengers}명 탑승 시 1인당 ${formatWon(result.costPerPerson)}원`,
      "링크를 열면 같은 계산 결과를 바로 볼 수 있어요.",
    ].join("\n");

    setShareStatus("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "차비얼마",
          text: shareText,
          url: shareUrl.toString(),
        });
        setShareStatus("공유했습니다.");
        return;
      }

      await navigator.clipboard.writeText(
        `${shareText}\n${shareUrl.toString()}`
      );
      setShareStatus("공유 링크를 클립보드에 복사했습니다.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          `${shareText}\n${shareUrl.toString()}`
        );
        setShareStatus("공유 링크를 클립보드에 복사했습니다.");
      } catch {
        setShareStatus("공유하지 못했습니다. 다시 시도해주세요.");
      }
    }
  };

  const fetchRoute = async (
    from: Place,
    to: Place
  ): Promise<RouteResult> => {
    const params = new URLSearchParams({
      origin: from.roadAddress || from.address,
      destination: to.roadAddress || to.address,
    });

    const response = await fetch(
      `/api/route?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          `${from.name} → ${to.name} 경로를 조회하지 못했습니다.`
      );
    }

    return {
      distanceKm: Number(data.distanceKm),
      durationMinutes: Number(data.durationMinutes),
      tollFee: Number(data.tollFee),
    };
  };

  const fetchFuelPrice = async () => {
    if (!origin) {
      return null;
    }

    const params = new URLSearchParams({
      lng: String(origin.lng),
      lat: String(origin.lat),
      fuel: fuelType,
    });

    const response = await fetch(
      `/api/fuel?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "출발지 주변 유가를 조회하지 못했습니다."
      );
    }

    return data as FuelResult;
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (
      !vehicle.supported ||
      !vehicle.efficiency ||
      vehicle.efficiency <= 0
    ) {
      return;
    }

    let nextFuelType: FuelType;

    if (vehicle.fuelCategory === "diesel") {
      nextFuelType = "diesel";
    } else if (vehicle.fuelCategory === "lpg") {
      nextFuelType = "lpg";
    } else {
      nextFuelType = "gasoline";
    }

    setSelectedVehicle(vehicle);
    setFuelType(nextFuelType);
    setEfficiency(String(vehicle.efficiency));

    /*
     * 차량 선택으로 연료 종류가 바뀔 수 있으므로
     * 기존 Opinet 결과는 폐기한다.
     */
    setFuelInfo(null);
    setFuelPrice("");
    setFuelAutoError("");
    resetResult();
  };

  const handleVehicleClear = () => {
    setSelectedVehicle(null);

    /*
     * 차량 선택만 해제하고 현재 연료/연비 값은 유지한다.
     * 사용자가 방금 적용된 값을 직접 수정해서
     * 계속 사용할 수 있다.
     */
    resetResult();
  };

  const handleCalculate = async () => {
    if (!origin || !destination) {
      setError("출발지와 목적지를 모두 선택해주세요.");
      return;
    }

    const fuelEfficiency = Number(efficiency);

    if (
      !Number.isFinite(fuelEfficiency) ||
      fuelEfficiency <= 0
    ) {
      setError("올바른 차량 연비를 입력해주세요.");
      return;
    }

    if (passengers < 1) {
      setError("탑승 인원은 1명 이상이어야 합니다.");
      return;
    }

    if (fuelAutoError && Number(fuelPrice) <= 0) {
      setError(
        "유가 자동조회에 실패했습니다. 현재 유가를 직접 입력해주세요."
      );
      return;
    }

    setLoading(true);
    setError("");
    setRoute(null);

    try {
      /*
       * 기존에 자동조회한 유가 또는 사용자가 직접 입력한
       * 유가가 있으면 Opinet을 다시 호출하지 않는다.
       */
      if (Number(fuelPrice) <= 0) {
        try {
          const nextFuelInfo = await fetchFuelPrice();

          if (nextFuelInfo) {
            setFuelInfo(nextFuelInfo);
            setFuelPrice(
              String(nextFuelInfo.averagePrice)
            );
            setFuelAutoError("");
          }
        } catch (fuelError) {
          /*
           * 유가 조회 실패는 경로 조회를 막지 않는다.
           */
          setFuelInfo(null);

          setFuelAutoError(
            fuelError instanceof Error
              ? fuelError.message
              : "유가 자동조회에 실패했습니다."
          );
        }
      }

      let outbound: RouteResult;
      let returnRoute: RouteResult | null = null;

      if (tripType === "roundtrip") {
        const [outboundResult, returnResult] =
          await Promise.all([
            fetchRoute(origin, destination),
            fetchRoute(destination, origin),
          ]);

        outbound = outboundResult;
        returnRoute = returnResult;
      } else {
        outbound = await fetchRoute(
          origin,
          destination
        );
      }

      const totalDistanceKm =
        outbound.distanceKm +
        (returnRoute?.distanceKm ?? 0);

      const totalDurationMinutes =
        outbound.durationMinutes +
        (returnRoute?.durationMinutes ?? 0);

      const totalTollFee =
        outbound.tollFee +
        (returnRoute?.tollFee ?? 0);

      setRoute({
        outbound,
        returnRoute,
        totalDistanceKm,
        totalDurationMinutes,
        totalTollFee,
      });
    } catch (routeError) {
      setError(
        routeError instanceof Error
          ? routeError.message
          : "경로 계산 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <p className="mb-2 text-sm font-bold text-blue-600">
            차비얼마
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            차로 가면
            <br />
            얼마 들까요?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            출발지와 목적지만 검색하세요.
            <br />
            거리, 시간, 통행료와 예상 차비를 계산해드립니다.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-5">
            <PlaceAutocomplete
              label="출발지"
              placeholder="출발지를 검색하세요"
              selectedPlace={origin}
              onSelect={(place) => {
                setOrigin(place);
                resetFuel();
              }}
              onClear={() => {
                setOrigin(null);
                resetFuel();
              }}
            />

            <PlaceAutocomplete
              label="목적지"
              placeholder="목적지를 검색하세요"
              selectedPlace={destination}
              onSelect={(place) => {
                setDestination(place);
                resetResult();
              }}
              onClear={() => {
                setDestination(null);
                resetResult();
              }}
            />

            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setTripType("oneway");
                  resetResult();
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  tripType === "oneway"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                편도
              </button>

              <button
                type="button"
                onClick={() => {
                  setTripType("roundtrip");
                  resetResult();
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  tripType === "roundtrip"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                왕복
              </button>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    내 차량 선택
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    선택사항
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  차량을 선택하면 공인 복합연비와 연료가
                  자동으로 적용됩니다.
                </p>
              </div>

              <VehicleSearch
                selectedVehicle={selectedVehicle}
                onSelect={handleVehicleSelect}
                onClear={handleVehicleClear}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                연료 종류
              </label>

              <select
                value={fuelType}
                onChange={(event) => {
                  setFuelType(
                    event.target.value as FuelType
                  );

                  /*
                   * 직접 연료를 변경하면 선택 차량과
                   * 현재 계산 조건이 달라질 수 있으므로
                   * 차량 선택 상태를 해제한다.
                   */
                  setSelectedVehicle(null);
                  resetFuel();
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {FUEL_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <InputField
                label="차량 연비"
                value={efficiency}
                onChange={(value) => {
                  setEfficiency(value);
                  resetResult();
                }}
                placeholder="예: 12"
                unit="km/L"
              />

              {selectedVehicle?.efficiency && (
                <p className="mt-2 text-xs leading-5 text-blue-600">
                  선택한 차량의 공인 복합연비{" "}
                  {selectedVehicle.efficiency.toFixed(1)} km/L를
                  적용했습니다. 실제 연비에 맞게 직접 수정할
                  수도 있습니다.
                </p>
              )}
            </div>

            {fuelInfo ? (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  적용 유가
                </label>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={fuelPrice}
                      onChange={(event) => {
                        setFuelPrice(event.target.value);
                        resetResult();
                      }}
                      className="min-w-0 flex-1 bg-transparent text-xl font-bold outline-none"
                    />

                    <span className="text-sm font-semibold text-slate-500">
                      원/L
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {origin?.name} 주변 {fuelInfo.radiusKm}km ·{" "}
                    {fuelInfo.stationCount}개 주유소 평균
                  </p>

                  <p className="text-xs leading-5 text-slate-500">
                    주변 최저가{" "}
                    {formatWon(fuelInfo.lowest.price)}
                    원/L · {fuelInfo.lowest.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    출처: Opinet · 직접 수정 가능
                  </p>
                </div>
              </div>
            ) : fuelAutoError ? (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  현재 유가
                </label>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-amber-800">
                    유가 자동조회에 실패했습니다.
                  </p>

                  <p className="mb-3 text-xs leading-5 text-amber-700">
                    아래에 현재 유가를 직접 입력하면 계속
                    계산할 수 있습니다.
                  </p>

                  <div className="flex items-center rounded-xl border border-amber-200 bg-white">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={fuelPrice}
                      onChange={(event) => {
                        setFuelPrice(event.target.value);
                        resetResult();
                      }}
                      placeholder="예: 1834"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                    />

                    <span className="pr-4 text-sm font-medium text-slate-400">
                      원/L
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                출발지와 연료 종류를 기준으로 계산할 때 주변
                주유소의 평균 유가를 자동 적용합니다.
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                탑승 인원
              </label>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setPassengers((prev) =>
                      Math.max(1, prev - 1)
                    );
                    resetResult();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium"
                  aria-label="탑승 인원 감소"
                >
                  −
                </button>

                <strong className="text-lg">
                  {passengers}명
                </strong>

                <button
                  type="button"
                  onClick={() => {
                    setPassengers((prev) => prev + 1);
                    resetResult();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium"
                  aria-label="탑승 인원 증가"
                >
                  +
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading
                ? "차비 계산 중..."
                : "차비 계산하기"}
            </button>
          </div>
        </section>

        {recentCalculations.length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">최근 계산</h2>
                <p className="mt-1 text-xs text-slate-500">
                  최근 계산한 경로를 최대 5개까지 저장합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={clearRecentCalculations}
                className="shrink-0 text-xs font-semibold text-slate-400 hover:text-red-500"
              >
                전체 삭제
              </button>
            </div>

            <div className="space-y-3">
              {recentCalculations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => loadRecentCalculation(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.origin.name} → {item.destination.name}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.tripType === "roundtrip" ? "왕복" : "편도"}
                        {item.selectedVehicle
                          ? ` · ${item.selectedVehicle.model}`
                          : ` · 연비 ${item.efficiency} km/L`}
                        {` · ${item.passengers}명`}
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            ₩{formatWon(item.totalCost)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            1인당 ₩{formatWon(item.costPerPerson)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-500">
                            {formatDistance(item.route.totalDistanceKm)} km
                          </p>
                          <p className="mt-1 text-[11px] text-blue-600">
                            다시 보기
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRecentCalculation(item.id)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      aria-label="최근 계산 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {route && result && origin && destination && (
          <section id="calculation-result" className="mt-6 scroll-mt-4">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="bg-slate-900 p-6 text-white">
                <p className="text-sm font-medium text-slate-300">
                  {origin.name} → {destination.name}
                </p>

                <p className="mt-3 text-sm text-slate-300">
                  {tripType === "roundtrip" ? "왕복" : "편도"} 총
                  예상 차비
                </p>

                <p className="mt-1 text-4xl font-bold">
                  ₩{formatWon(result.totalCost)}
                </p>

                <div className="mt-5 rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300">
                    {passengers}명 탑승 시 1인당
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    ₩{formatWon(result.costPerPerson)}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-6">
                {selectedVehicle && (
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-600">
                      적용 차량
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedVehicle.model}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {selectedVehicle.year
                        ? `${selectedVehicle.year}년 · `
                        : ""}
                      {selectedVehicle.fuel || ""}
                      {selectedVehicle.efficiency
                        ? ` · 공인 복합연비 ${selectedVehicle.efficiency.toFixed(
                            1
                          )} km/L`
                        : ""}
                    </p>
                  </div>
                )}

                <ResultRow
                  label="총 이동거리"
                  value={`${formatDistance(
                    route.totalDistanceKm
                  )} km`}
                />

                <ResultRow
                  label="예상 이동시간"
                  value={formatDuration(
                    route.totalDurationMinutes
                  )}
                />

                <ResultRow
                  label="적용 유가"
                  value={`${formatWon(Number(fuelPrice))}원/L`}
                />

                <ResultRow
                  label="적용 연비"
                  value={`${Number(efficiency).toLocaleString(
                    "ko-KR"
                  )} km/L`}
                />

                <ResultRow
                  label="예상 연료 사용량"
                  value={`${result.fuelUsed.toFixed(2)} L`}
                />

                <ResultRow
                  label="예상 연료비"
                  value={`₩${formatWon(result.fuelCost)}`}
                />

                <ResultRow
                  label="통행료"
                  value={`₩${formatWon(route.totalTollFee)}`}
                />

                {tripType === "roundtrip" &&
                  route.returnRoute && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        왕복 경로
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">
                            가는 길
                          </span>

                          <span className="text-right font-medium">
                            {formatDistance(
                              route.outbound.distanceKm
                            )}
                            km ·{" "}
                            {formatDuration(
                              route.outbound.durationMinutes
                            )}
                            {" · "}₩
                            {formatWon(route.outbound.tollFee)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">
                            오는 길
                          </span>

                          <span className="text-right font-medium">
                            {formatDistance(
                              route.returnRoute.distanceKm
                            )}
                            km ·{" "}
                            {formatDuration(
                              route.returnRoute.durationMinutes
                            )}
                            {" · "}₩
                            {formatWon(
                              route.returnRoute.tollFee
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.99]"
                  >
                    공유하기
                  </button>

                  {shareStatus && (
                    <p className="mt-2 text-center text-xs font-medium text-slate-500">
                      {shareStatus}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    계산식
                  </p>

                  <p className="text-sm leading-6 text-slate-600">
                    {formatDistance(route.totalDistanceKm)}
                    km ÷ {efficiency}km/L ={" "}
                    {result.fuelUsed.toFixed(2)}L
                  </p>

                  <p className="text-sm leading-6 text-slate-600">
                    {result.fuelUsed.toFixed(2)}L ×{" "}
                    {Number(fuelPrice).toLocaleString("ko-KR")}
                    원 = 약 {formatWon(result.fuelCost)}원
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    연료비 {formatWon(result.fuelCost)}원 + 통행료{" "}
                    {formatWon(route.totalTollFee)}원 = 총{" "}
                    {formatWon(result.totalCost)}원
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          차량 연비는 한국에너지공단 공인 표시연비 정보를
          활용합니다.
          <br />
          유가는 출발지 주변 주유소 정보를 기준으로 계산합니다.
          <br />
          실제 비용은 교통상황과 주행환경에 따라 달라질 수
          있습니다.
        </p>
      </div>
    </main>
  );
}

function VehicleSearch({
  selectedVehicle,
  onSelect,
  onClear,
}: {
  selectedVehicle: Vehicle | null;
  onSelect: (vehicle: Vehicle) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchError, setSearchError] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (selectedVehicle) {
      return;
    }

    const keyword = query.trim();

    if (keyword.length < 2) {
      setVehicles([]);
      setSearchError("");
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({
          model: keyword,
        });

        const response = await fetch(
          `/api/vehicles?${params.toString()}`
        );

        const data = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          setVehicles([]);
          setSearchError(
            data.error || "차량을 검색하지 못했습니다."
          );
          return;
        }

        const nextVehicles = Array.isArray(data.vehicles)
          ? data.vehicles.slice(0, 12)
          : [];

        setVehicles(nextVehicles);
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setVehicles([]);
          setSearchError(
            "차량 검색 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, selectedVehicle]);

  if (selectedVehicle) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">
                {selectedVehicle.model}
              </p>

              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                {selectedVehicle.efficiency?.toFixed(1)} km/L
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              {selectedVehicle.manufacturer}
              {selectedVehicle.year
                ? ` · ${selectedVehicle.year}년`
                : ""}
              {selectedVehicle.fuel
                ? ` · ${selectedVehicle.fuel}`
                : ""}
            </p>

            <p className="text-xs leading-5 text-slate-500">
              {[
                formatDisplacement(
                  selectedVehicle.displacement
                ),
                selectedVehicle.transmission,
                selectedVehicle.carType,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <p className="mt-1 text-xs font-medium text-blue-600">
              공인 복합연비 자동 적용
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setVehicles([]);
              setSearchError("");
              onClear();
            }}
            className="shrink-0 text-sm font-semibold text-blue-600"
          >
            변경
          </button>
        </div>
      </div>
    );
  }

  const showDropdown =
    focused && query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setFocused(false);
            }, 150);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setVehicles([]);
            setSearchError("");
          }}
          placeholder="차량명 검색 예: 아반떼, 쏘렌토"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading && vehicles.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              차량을 찾고 있어요...
            </div>
          ) : searchError ? (
            <div className="px-4 py-4 text-sm text-red-600">
              {searchError}
            </div>
          ) : vehicles.length > 0 ? (
            <>
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();

                    setQuery(vehicle.model);
                    setVehicles([]);
                    setFocused(false);

                    onSelect(vehicle);
                  }}
                  className="block w-full border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold leading-5 text-slate-900">
                        {vehicle.model}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {vehicle.manufacturer}
                        {vehicle.year
                          ? ` · ${vehicle.year}년`
                          : ""}
                        {vehicle.fuel
                          ? ` · ${vehicle.fuel}`
                          : ""}
                      </p>

                      <p className="text-xs leading-5 text-slate-400">
                        {[
                          formatDisplacement(
                            vehicle.displacement
                          ),
                          vehicle.transmission,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    {vehicle.efficiency && (
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-blue-600">
                          {vehicle.efficiency.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          km/L
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div className="bg-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-400">
                검색 결과 중 최대 12개를 표시합니다.
              </div>
            </>
          ) : (
            <div className="px-4 py-4 text-sm leading-6 text-slate-500">
              검색 결과가 없습니다.
              <br />
              차량명을 간단하게 입력해보세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlaceAutocomplete({
  label,
  placeholder,
  selectedPlace,
  onSelect,
  onClear,
}: {
  label: string;
  placeholder: string;
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (selectedPlace) {
      return;
    }

    const keyword = query.trim();

    if (keyword.length < 2) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          query: keyword,
        });

        const response = await fetch(
          `/api/places?${params.toString()}`
        );

        const data = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          setPlaces([]);
          return;
        }

        setPlaces(data.places || []);
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setPlaces([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, selectedPlace]);

  if (selectedPlace) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold">
          {label}
        </label>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-slate-900">
                {selectedPlace.name}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {selectedPlace.roadAddress ||
                  selectedPlace.address}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPlaces([]);
                onClear();
              }}
              className="shrink-0 text-sm font-semibold text-blue-600"
            >
              변경
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showDropdown =
    focused && query.trim().length >= 2;

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setFocused(false);
            }, 150);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setPlaces([]);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && places.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              장소를 찾고 있어요...
            </div>
          ) : places.length > 0 ? (
            places.map((place) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();

                  setQuery(place.name);
                  setPlaces([]);
                  setFocused(false);

                  onSelect(place);
                }}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
              >
                <p className="truncate font-semibold text-slate-900">
                  {place.name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {place.roadAddress || place.address}
                </p>

                {place.category && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {place.category}
                  </p>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 outline-none"
        />

        <span className="pr-4 text-sm font-medium text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}
