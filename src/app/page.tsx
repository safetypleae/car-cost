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

export default function Home() {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);

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
  }, [
    route,
    efficiency,
    fuelPrice,
    passengers,
  ]);

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

    /*
     * 자동 유가 조회에 실패한 상태에서는
     * 사용자가 직접 가격을 입력해야 계산 가능
     */
    if (
      fuelAutoError &&
      Number(fuelPrice) <= 0
    ) {
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
       * 1. 유가
       *
       * 기존에 자동조회했거나 사용자가 직접 수정한
       * 유가가 있으면 Opinet을 다시 호출하지 않는다.
       */
      if (Number(fuelPrice) <= 0) {
        try {
          const nextFuelInfo =
            await fetchFuelPrice();

          if (nextFuelInfo) {
            setFuelInfo(nextFuelInfo);
            setFuelPrice(
              String(nextFuelInfo.averagePrice)
            );
            setFuelAutoError("");
          }
        } catch (fuelError) {
          /*
           * Opinet 오류 때문에 경로 계산까지
           * 막지 않는다.
           */
          setFuelInfo(null);

          setFuelAutoError(
            fuelError instanceof Error
              ? fuelError.message
              : "유가 자동조회에 실패했습니다."
          );
        }
      }

      /*
       * 2. 실제 경로 조회
       *
       * 편도:
       * 출발 → 목적지
       *
       * 왕복:
       * 출발 → 목적지
       * 목적지 → 출발
       *
       * 왕복을 단순 ×2 하지 않는다.
       */
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
                        setFuelPrice(
                          event.target.value
                        );
                        resetResult();
                      }}
                      className="min-w-0 flex-1 bg-transparent text-xl font-bold outline-none"
                    />

                    <span className="text-sm font-semibold text-slate-500">
                      원/L
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {origin?.name} 주변{" "}
                    {fuelInfo.radiusKm}km ·{" "}
                    {fuelInfo.stationCount}개 주유소 평균
                  </p>

                  <p className="text-xs leading-5 text-slate-500">
                    주변 최저가{" "}
                    {formatWon(
                      fuelInfo.lowest.price
                    )}
                    원/L ·{" "}
                    {fuelInfo.lowest.name}
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
                    아래에 현재 유가를 직접 입력하면
                    계속 계산할 수 있습니다.
                  </p>

                  <div className="flex items-center rounded-xl border border-amber-200 bg-white">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={fuelPrice}
                      onChange={(event) => {
                        setFuelPrice(
                          event.target.value
                        );
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
                출발지와 연료 종류를 기준으로 계산할 때
                주변 주유소의 평균 유가를 자동 적용합니다.
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
                    setPassengers(
                      (prev) => prev + 1
                    );
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

        {route &&
          result &&
          origin &&
          destination && (
            <section className="mt-6">
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="bg-slate-900 p-6 text-white">
                  <p className="text-sm font-medium text-slate-300">
                    {origin.name} →{" "}
                    {destination.name}
                  </p>

                  <p className="mt-3 text-sm text-slate-300">
                    {tripType === "roundtrip"
                      ? "왕복"
                      : "편도"}{" "}
                    총 예상 차비
                  </p>

                  <p className="mt-1 text-4xl font-bold">
                    ₩
                    {formatWon(
                      result.totalCost
                    )}
                  </p>

                  <div className="mt-5 rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-300">
                      {passengers}명 탑승 시 1인당
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      ₩
                      {formatWon(
                        result.costPerPerson
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6">
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
                    value={`${formatWon(
                      Number(fuelPrice)
                    )}원/L`}
                  />

                  <ResultRow
                    label="예상 연료 사용량"
                    value={`${result.fuelUsed.toFixed(
                      2
                    )} L`}
                  />

                  <ResultRow
                    label="예상 연료비"
                    value={`₩${formatWon(
                      result.fuelCost
                    )}`}
                  />

                  <ResultRow
                    label="통행료"
                    value={`₩${formatWon(
                      route.totalTollFee
                    )}`}
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
                                route.outbound
                                  .distanceKm
                              )}
                              km ·{" "}
                              {formatDuration(
                                route.outbound
                                  .durationMinutes
                              )}
                              {" · "}
                              ₩
                              {formatWon(
                                route.outbound
                                  .tollFee
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">
                              오는 길
                            </span>

                            <span className="text-right font-medium">
                              {formatDistance(
                                route.returnRoute
                                  .distanceKm
                              )}
                              km ·{" "}
                              {formatDuration(
                                route.returnRoute
                                  .durationMinutes
                              )}
                              {" · "}
                              ₩
                              {formatWon(
                                route.returnRoute
                                  .tollFee
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="border-t border-slate-200 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      계산식
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {formatDistance(
                        route.totalDistanceKm
                      )}
                      km ÷ {efficiency}km/L ={" "}
                      {result.fuelUsed.toFixed(
                        2
                      )}
                      L
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {result.fuelUsed.toFixed(
                        2
                      )}
                      L ×{" "}
                      {Number(
                        fuelPrice
                      ).toLocaleString(
                        "ko-KR"
                      )}
                      원 = 약{" "}
                      {formatWon(
                        result.fuelCost
                      )}
                      원
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      연료비{" "}
                      {formatWon(
                        result.fuelCost
                      )}
                      원 + 통행료{" "}
                      {formatWon(
                        route.totalTollFee
                      )}
                      원 = 총{" "}
                      {formatWon(
                        result.totalCost
                      )}
                      원
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          유가는 출발지 주변 주유소 정보를 기준으로
          계산합니다.
          <br />
          실제 비용은 교통상황과 주행환경에 따라 달라질 수
          있습니다.
        </p>
      </div>
    </main>
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

    const currentRequestId =
      ++requestIdRef.current;

    const timer = window.setTimeout(
      async () => {
        setLoading(true);

        try {
          const params =
            new URLSearchParams({
              query: keyword,
            });

          const response = await fetch(
            `/api/places?${params.toString()}`
          );

          const data =
            await response.json();

          if (
            currentRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          if (!response.ok) {
            setPlaces([]);
            return;
          }

          setPlaces(data.places || []);
        } catch {
          if (
            currentRequestId ===
            requestIdRef.current
          ) {
            setPlaces([]);
          }
        } finally {
          if (
            currentRequestId ===
            requestIdRef.current
          ) {
            setLoading(false);
          }
        }
      },
      400
    );

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
          {loading &&
          places.length === 0 ? (
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
                  {place.roadAddress ||
                    place.address}
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
