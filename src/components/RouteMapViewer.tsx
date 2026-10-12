"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Place = { name: string; lat: number; lng: number };
type Point = [number, number]; // longitude, latitude
type RouteOption = "traoptimal" | "trafast" | "traavoidtoll";
type RouteDetail = {
  distanceKm: number;
  durationMinutes: number;
  tollFee: number;
  path: Point[];
};
type RouteData = {
  outbound: Partial<Record<RouteOption, RouteDetail>>;
  returning: Partial<Record<RouteOption, RouteDetail>> | null;
  mapClientId: string;
};
type Comparison = {
  option: RouteOption;
  distanceKm: number;
  durationMinutes: number;
  fuelCost: number;
  tollFee: number;
  totalCost: number;
};
type NaverMapSdk = {
  LatLng: new (lat: number, lng: number) => object;
  LatLngBounds: new (sw: object, ne: object) => object;
  Map: new (container: HTMLElement, options: {
    center: object;
    zoom: number;
    zoomControl: boolean;
  }) => { fitBounds: (bounds: object) => void };
  Marker: new (options: { map: object; position: object; title: string }) => object;
  Polyline: new (options: {
    map: object;
    path: object[];
    strokeColor: string;
    strokeWeight: number;
    strokeOpacity: number;
  }) => object;
};

declare global {
  interface Window {
    naver?: { maps: NaverMapSdk };
  }
}

const OPTIONS: { option: RouteOption; label: string; detail: string }[] = [
  { option: "traoptimal", label: "최적 경로", detail: "실시간 최적" },
  { option: "trafast", label: "빠른 경로", detail: "실시간 빠른 길" },
  { option: "traavoidtoll", label: "무료도로 우선", detail: "통행료 최소화 우선" },
];

const won = (value: number) => Math.round(value).toLocaleString("ko-KR");
const distance = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}시간 ${rest ? `${rest}분` : ""}`.trim() : `${rest}분`;
};

function validPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === "number" && typeof value[1] === "number" &&
    Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
    value[0] >= 124 && value[0] <= 132 && value[1] >= 32 && value[1] <= 40;
}

let sdkPromise: Promise<NaverMapSdk> | null = null;

function loadMapSdk(clientId: string): Promise<NaverMapSdk> {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  if (!/^[A-Za-z0-9_-]+$/.test(clientId)) {
    return Promise.reject(new Error("지도 인증 정보를 확인할 수 없습니다."));
  }
  if (!sdkPromise) {
    sdkPromise = new Promise<NaverMapSdk>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=" + encodeURIComponent(clientId);
      script.async = true;
      script.onload = () => {
        if (window.naver?.maps) resolve(window.naver.maps);
        else reject(new Error("네이버 지도 SDK 초기화에 실패했습니다."));
      };
      script.onerror = () => reject(new Error("네이버 지도 인증에 실패했습니다. 등록된 웹 서비스 URL을 확인해 주세요."));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

export default function RouteMapViewer({
  origin,
  destination,
  roundTrip,
  efficiency,
  fuelPrice,
  parkingFee,
  passengers,
}: {
  origin: Place;
  destination: Place;
  roundTrip: boolean;
  efficiency: number;
  fuelPrice: number;
  parkingFee: number;
  passengers: number;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [routes, setRoutes] = useState<RouteData | null>(null);
  const [selectedOption, setSelectedOption] = useState<RouteOption>("traoptimal");
  const [mapError, setMapError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || routes) return;
    let cancelled = false;

    async function loadOptions() {
      setStatus("loading");
      setError("");
      try {
        const params = new URLSearchParams({
          originLat: String(origin.lat),
          originLng: String(origin.lng),
          destinationLat: String(destination.lat),
          destinationLng: String(destination.lng),
          roundTrip: roundTrip ? "1" : "0",
        });
        const response = await fetch("/api/route-options?" + params.toString(), { cache: "no-store" });
        const data = await response.json() as RouteData & { error?: string };
        if (!response.ok) throw new Error(data.error || "경로 비교를 불러오지 못했습니다.");
        if (!data.outbound || !Object.keys(data.outbound).length) {
          throw new Error("비교 가능한 경로가 없습니다.");
        }
        if (!cancelled) {
          setRoutes(data);
          setSelectedOption(data.outbound.traoptimal ? "traoptimal" : OPTIONS.find((item) => data.outbound[item.option])!.option);
          setStatus("ready");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "경로 비교 중 오류가 발생했습니다.");
          setStatus("error");
        }
      }
    }

    void loadOptions();
    return () => { cancelled = true; };
  }, [open, routes, origin.lat, origin.lng, destination.lat, destination.lng, roundTrip]);

  const comparisons = useMemo(() => {
    if (!routes || !(efficiency > 0) || !(fuelPrice > 0)) return [];
    return OPTIONS.flatMap(({ option }): Comparison[] => {
      const outbound = routes.outbound[option];
      const returning = roundTrip ? routes.returning?.[option] : null;
      if (!outbound || (roundTrip && !returning)) return [];
      const distanceKm = outbound.distanceKm + (returning?.distanceKm ?? 0);
      const durationMinutes = outbound.durationMinutes + (returning?.durationMinutes ?? 0);
      const tollFee = outbound.tollFee + (returning?.tollFee ?? 0);
      const fuelCost = distanceKm / efficiency * fuelPrice;
      return [{ option, distanceKm, durationMinutes, tollFee, fuelCost,
        totalCost: fuelCost + tollFee + parkingFee }];
    });
  }, [routes, roundTrip, efficiency, fuelPrice, parkingFee]);

  const cheapest = comparisons.reduce<Comparison | null>(
    (best, item) => !best || item.totalCost < best.totalCost ? item : best, null
  );
  const optimal = comparisons.find((item) => item.option === "traoptimal") ?? comparisons[0];
  const savings = optimal && cheapest ? Math.max(0, Math.round(optimal.totalCost) - Math.round(cheapest.totalCost)) : 0;
  const selected = comparisons.find((item) => item.option === selectedOption);

  useEffect(() => {
    if (!open || status !== "ready" || !routes || !containerRef.current) return;
    let cancelled = false;

    async function draw() {
      setMapError("");
      try {
        const outbound = routes!.outbound[selectedOption];
        const returning = roundTrip ? routes!.returning?.[selectedOption] : null;
        if (!outbound || (roundTrip && !returning)) return;
        const paths = [outbound.path, ...(returning ? [returning.path] : [])]
          .map((path) => Array.isArray(path) ? path.filter(validPoint) : []);
        if (paths.some((path) => path.length < 2)) {
          throw new Error("선택한 경로의 지도 좌표가 제공되지 않습니다.");
        }

        const sdk = await loadMapSdk(routes!.mapClientId);
        if (cancelled || !containerRef.current) return;
        // The map is recreated only when the user selects another route.
        containerRef.current.replaceChildren();
        const map = new sdk.Map(containerRef.current, {
          center: new sdk.LatLng(origin.lat, origin.lng),
          zoom: 10,
          zoomControl: true,
        });

        let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
        paths.forEach((path, index) => {
          const points = path.map(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            return new sdk.LatLng(lat, lng);
          });
          new sdk.Polyline({
            map, path: points,
            strokeColor: index === 0 ? "#2563eb" : "#ea580c",
            strokeWeight: 5, strokeOpacity: 0.9,
          });
        });
        new sdk.Marker({ map, position: new sdk.LatLng(origin.lat, origin.lng), title: "출발지: " + origin.name });
        new sdk.Marker({ map, position: new sdk.LatLng(destination.lat, destination.lng), title: "도착지: " + destination.name });
        map.fitBounds(new sdk.LatLngBounds(
          new sdk.LatLng(minLat, minLng),
          new sdk.LatLng(maxLat, maxLng)
        ));
      } catch (caught) {
        if (!cancelled) setMapError(caught instanceof Error ? caught.message : "지도를 표시하지 못했습니다.");
      }
    }

    void draw();
    return () => { cancelled = true; };
  }, [open, status, routes, selectedOption, roundTrip, origin.name, origin.lat, origin.lng, destination.name, destination.lat, destination.lng]);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button
        type="button"
        className="w-full px-5 py-4 text-left text-sm font-bold text-blue-700 hover:bg-slate-50"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        {open ? "▲ 경로별 이동비 비교 닫기" : "▼ 경로별 이동비 비교 · 지도 보기"}
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          {status === "loading" && (
            <p role="status" className="py-4 text-center text-sm text-slate-500">실시간 경로와 비용을 비교하는 중...</p>
          )}
          {status === "error" && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>
          )}
          {status === "ready" && comparisons.length > 0 && (
            <>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-700">같은 차량·유가 기준 경로별 예상 비용</p>
                {savings > 0 ? (
                  <p className="mt-1 text-lg font-bold text-blue-900">
                    최적 경로 대비 최대 {won(savings)}원 절약
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-blue-900">
                    조회된 경로 중 최적 경로가 가장 경제적입니다.
                  </p>
                )}
                <p className="mt-1 text-xs text-blue-700">
                  {roundTrip ? "왕복" : "편도"} 기준 · 주차비 {won(parkingFee)}원 포함
                </p>
              </div>
              <div className="space-y-2" role="group" aria-label="비교할 경로 선택">
                {comparisons.map((item) => {
                  const definition = OPTIONS.find((entry) => entry.option === item.option)!;
                  const isCheapest = item.option === cheapest?.option;
                  const isSelected = item.option === selectedOption;
                  return (
                    <button
                      key={item.option}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedOption(item.option)}
                      className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-200"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {definition.label} {isCheapest && <span className="ml-1 text-xs font-bold text-blue-600">· 최저 비용</span>}
                        </span>
                        <strong className="text-base text-slate-900">{won(item.totalCost)}원</strong>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {distance(item.distanceKm)}km · {duration(item.durationMinutes)} · 연료비 {won(item.fuelCost)}원 · 통행료 {won(item.tollFee)}원
                      </p>
                    </button>
                  );
                })}
              </div>
              {selected && (
                <p className="text-xs leading-5 text-slate-500">
                  선택 경로: {OPTIONS.find((item) => item.option === selected.option)?.label}
                  {passengers > 1 ? ` · 1인당 약 ${won(selected.totalCost / passengers)}원` : ""}
                </p>
              )}
              {mapError && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{mapError}</p>}
              <div
                ref={containerRef}
                aria-label="선택한 자동차 경로 지도"
                className="h-72 w-full rounded-xl bg-slate-100"
              />
              <p className="text-xs leading-5 text-slate-500">
                파란색은 가는 길{roundTrip ? ", 주황색은 오는 길" : ""}입니다.
                실시간 교통 상황에 따라 경로·비용이 달라질 수 있으며, 무료도로 우선도 통행료가 발생할 수 있습니다.
              </p>
            </>
          )}
          {status === "ready" && comparisons.length === 0 && (
            <p className="text-sm text-slate-500">현재 비교할 수 있는 경로가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
