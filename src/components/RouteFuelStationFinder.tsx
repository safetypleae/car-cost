"use client";

import { useEffect, useRef, useState } from "react";

type FuelType = "gasoline" | "diesel" | "premium" | "lpg";
type Place = { name: string; lat: number; lng: number };
type Point = [number, number];
type Recommendation = {
  id: string;
  name: string;
  brand: string;
  price: number;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  fillLiters: number;
  distanceDifferenceKm: number;
  durationDifferenceMinutes: number;
  additionalFuelCost: number;
  routeFuelDifference: number;
  tollDifference: number;
  fuelSavings: number;
  netSavings: number;
  path: Point[];
};
type SearchResult = {
  source: string;
  fetchedAt: string;
  referencePrice: number;
  searchedPoints: number;
  candidateLimit: number;
  verifiedCandidates: number;
  mapClientId: string;
  recommendations: Recommendation[];
  message?: string;
  scopeNotice?: string;
  error?: string;
};

type MapsSdk = {
  LatLng: new (lat: number, lng: number) => object;
  LatLngBounds: new (sw: object, ne: object) => object;
  Map: new (container: HTMLElement, options: { center: object; zoom: number; zoomControl: boolean }) => {
    fitBounds: (bounds: object) => void;
  };
  Marker: new (options: { map: object; position: object; title: string }) => object;
  Polyline: new (options: { map: object; path: object[]; strokeColor: string; strokeWeight: number; strokeOpacity: number }) => object;
};

const fuelLabels: Record<FuelType, string> = {
  gasoline: "휘발유",
  diesel: "경유",
  premium: "고급휘발유",
  lpg: "LPG",
};
const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const signedWon = (value: number) => `${value > 0 ? "+" : ""}${Math.round(value).toLocaleString("ko-KR")}원`;
const signedDistance = (value: number) => `${value > 0 ? "+" : ""}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}km`;
const signedMinutes = (value: number) => `${value > 0 ? "+" : ""}${Math.round(value)}분`;

function loadMapSdk(clientId: string): Promise<MapsSdk> {
  const browserWindow = window as typeof window & { naver?: { maps: MapsSdk } };
  if (browserWindow.naver?.maps) return Promise.resolve(browserWindow.naver.maps);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]');
    const finish = () => browserWindow.naver?.maps
      ? resolve(browserWindow.naver.maps)
      : reject(new Error("네이버 지도 SDK를 불러오지 못했습니다."));
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 1000);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("네이버 지도를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

export default function RouteFuelStationFinder({
  origin,
  destination,
  roundTrip,
  efficiency,
  fuelPrice,
  fuelType,
}: {
  origin: Place;
  destination: Place;
  roundTrip: boolean;
  efficiency: number;
  fuelPrice: number;
  fuelType: FuelType;
}) {
  const [open, setOpen] = useState(false);
  const [fillLiters, setFillLiters] = useState("40");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [mapError, setMapError] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  const selected = result?.recommendations.find((station) => station.id === selectedId) ?? result?.recommendations[0];

  const search = async () => {
    const liters = Number(fillLiters);
    if (!Number.isFinite(liters) || liters <= 0 || liters > 200) {
      setStatus("error");
      setError("예상 주유량을 0L 초과 200L 이하로 입력해주세요.");
      return;
    }
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/route-fuel-stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, roundTrip, efficiency, fuelPrice, fuelType, fillLiters: liters }),
      });
      const data = await response.json() as SearchResult;
      if (!response.ok) throw new Error(data.error || "주유소 추천 결과를 불러오지 못했습니다.");
      setResult(data);
      setSelectedId(data.recommendations[0]?.id ?? "");
      setStatus("ready");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "주유소 추천 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!open || !selected || !result?.mapClientId || !mapRef.current) return;
    let cancelled = false;
    const draw = async () => {
      setMapError("");
      try {
        const sdk = await loadMapSdk(result.mapClientId);
        if (cancelled || !mapRef.current) return;
        mapRef.current.replaceChildren();
        const map = new sdk.Map(mapRef.current, {
          center: new sdk.LatLng(selected.lat, selected.lng),
          zoom: 10,
          zoomControl: true,
        });
        const validPath = selected.path.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
        if (validPath.length < 2) throw new Error("경유 경로 좌표가 제공되지 않았습니다.");
        let minLat = selected.lat;
        let maxLat = selected.lat;
        let minLng = selected.lng;
        let maxLng = selected.lng;
        const path = validPath.map(([lng, lat]) => {
          minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
          return new sdk.LatLng(lat, lng);
        });
        new sdk.Polyline({ map, path, strokeColor: "#059669", strokeWeight: 5, strokeOpacity: 0.9 });
        new sdk.Marker({ map, position: new sdk.LatLng(origin.lat, origin.lng), title: `출발지: ${origin.name}` });
        new sdk.Marker({ map, position: new sdk.LatLng(destination.lat, destination.lng), title: `도착지: ${destination.name}` });
        new sdk.Marker({ map, position: new sdk.LatLng(selected.lat, selected.lng), title: `주유소: ${selected.name}` });
        map.fitBounds(new sdk.LatLngBounds(new sdk.LatLng(minLat, minLng), new sdk.LatLng(maxLat, maxLng)));
      } catch (caught) {
        if (!cancelled) setMapError(caught instanceof Error ? caught.message : "지도를 표시하지 못했습니다.");
      }
    };
    void draw();
    return () => { cancelled = true; };
  }, [open, selected, result?.mapClientId, origin, destination]);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button type="button" className="w-full px-5 py-4 text-left text-sm font-bold text-emerald-700 hover:bg-slate-50" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "▲ 경로상 최저비용 주유소 찾기 닫기" : "▼ ⛽ 경로상 최저비용 주유소 찾기"}
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">
          <div>
            <label htmlFor="route-fill-liters" className="mb-2 block text-sm font-semibold text-slate-800">예상 주유량</label>
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <input id="route-fill-liters" type="number" inputMode="decimal" min="0.1" max="200" step="0.1" value={fillLiters} onChange={(event) => setFillLiters(event.target.value)} className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" />
                <span className="pr-4 text-sm text-slate-400">L</span>
              </div>
              <button type="button" onClick={search} disabled={status === "loading"} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                {status === "loading" ? "검증 중..." : "TOP 3 찾기"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{fuelLabels[fuelType]} 기준 {won(fuelPrice)}/L · 연비 {efficiency.toLocaleString("ko-KR")}km/L · {roundTrip ? "왕복(가는 길에 주유)" : "편도"}</p>
          </div>

          {status === "loading" && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">경로 주변 후보를 찾고 실제 경유 거리·시간·통행료를 비교하고 있습니다.</p>}
          {status === "error" && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
          {status === "ready" && result && (
            <>
              {result.recommendations.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">절약 가능한 주유소 없음<br /><span className="font-normal text-slate-500">{result.message}</span></p>
              ) : (
                <div className="space-y-3">
                  {result.recommendations.map((station, index) => (
                    <button key={station.id} type="button" aria-pressed={selected?.id === station.id} onClick={() => setSelectedId(station.id)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === station.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-xs font-bold text-emerald-700">추천 {index + 1}</p><h3 className="mt-1 font-bold text-slate-900">{station.name}</h3></div>
                        <div className="text-right"><p className="text-xs text-slate-500">실질 절약액</p><strong className="text-lg text-emerald-700">{won(station.netSavings)}</strong></div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{station.address}{station.phone ? ` · ${station.phone}` : ""}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                        <Metric label={`${fuelLabels[fuelType]} 가격`} value={`${won(station.price)}/L`} />
                        <Metric label="예상 주유량" value={`${station.fillLiters.toLocaleString("ko-KR")}L`} />
                        <Metric label="추가 거리" value={signedDistance(station.distanceDifferenceKm)} />
                        <Metric label="추가 시간" value={signedMinutes(station.durationDifferenceMinutes)} />
                        <Metric label="추가 연료비" value={won(station.additionalFuelCost)} />
                        <Metric label="추가 통행료" value={signedWon(station.tollDifference)} />
                        <Metric label="주유비 절감액" value={won(station.fuelSavings)} />
                        {station.routeFuelDifference < 0 && <Metric label="경로 단축 연료비" value={`${won(-station.routeFuelDifference)} 절감`} />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selected && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">지도에서 선택한 주유소와 경유 경로 확인</p>
                  {mapError && <p role="alert" className="mb-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{mapError}</p>}
                  <div ref={mapRef} className="h-72 w-full rounded-xl bg-slate-100" aria-label={`${selected.name} 경유 경로 지도`} />
                </div>
              )}
              <p className="text-xs leading-5 text-slate-500">{result.scopeNotice} 조회 시각 {new Date(result.fetchedAt).toLocaleString("ko-KR")} · 가격은 오피넷 제공 시점과 실제 판매 시점에 차이가 있을 수 있습니다.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-slate-400">{label}</span><strong className="mt-0.5 block text-slate-800">{value}</strong></div>;
}
