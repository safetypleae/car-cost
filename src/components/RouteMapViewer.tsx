"use client";

import { useEffect, useRef, useState } from "react";

type Place = { name: string; lat: number; lng: number };
type Point = [number, number]; // NAVER Directions: [longitude, latitude]

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

let sdkPromise: Promise<NaverMapSdk> | null = null;

function loadMapSdk(clientId: string): Promise<NaverMapSdk> {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  if (!/^[A-Za-z0-9_-]+$/.test(clientId)) {
    return Promise.reject(new Error("지도 인증 정보를 확인할 수 없습니다."));
  }

  if (!sdkPromise) {
    sdkPromise = new Promise<NaverMapSdk>((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=" +
        encodeURIComponent(clientId);
      script.async = true;
      script.onload = () => {
        if (window.naver?.maps) resolve(window.naver.maps);
        else reject(new Error("네이버 지도 SDK 초기화에 실패했습니다."));
      };
      script.onerror = () => reject(new Error("네이버 지도 SDK를 불러오지 못했습니다. 등록된 웹 서비스 URL을 확인해 주세요."));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

function isPoint(value: unknown): value is Point {
  return Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= 124 && value[0] <= 132 &&
    value[1] >= 32 && value[1] <= 40;
}

async function getRouteGeometry(from: Place, to: Place): Promise<{
  path: Point[];
  clientId: string;
}> {
  const params = new URLSearchParams({
    origin: from.name,
    destination: to.name,
    originLat: String(from.lat),
    originLng: String(from.lng),
    destinationLat: String(to.lat),
    destinationLng: String(to.lng),
    includePath: "1",
  });
  const response = await fetch("/api/route?" + params.toString(), {
    cache: "no-store",
  });
  const data: {
    error?: string;
    path?: unknown;
    mapClientId?: string;
  } = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "지도 경로를 조회하지 못했습니다.");
  }
  const path = Array.isArray(data.path) ? data.path.filter(isPoint) : [];
  if (path.length < 2 || !data.mapClientId) {
    throw new Error("실제 도로 경로 좌표를 가져오지 못했습니다.");
  }
  return { path, clientId: data.mapClientId };
}

export default function RouteMapViewer({
  origin,
  destination,
  roundTrip,
}: {
  origin: Place;
  destination: Place;
  roundTrip: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function drawRoute() {
      try {
        const [outbound, returning] = await Promise.all([
          getRouteGeometry(origin, destination),
          roundTrip ? getRouteGeometry(destination, origin) : Promise.resolve(null),
        ]);
        const sdk = await loadMapSdk(outbound.clientId);
        if (cancelled || !containerRef.current) return;

        const paths = [outbound.path, ...(returning ? [returning.path] : [])];
        const coordinates = paths.flat();
        const latitudes = coordinates.map((point) => point[1]);
        const longitudes = coordinates.map((point) => point[0]);
        const center = new sdk.LatLng(origin.lat, origin.lng);
        const map = new sdk.Map(containerRef.current, {
          center,
          zoom: 10,
          zoomControl: true,
        });

        paths.forEach((path, index) => {
          new sdk.Polyline({
            map,
            path: path.map((point) => new sdk.LatLng(point[1], point[0])),
            strokeColor: index === 0 ? "#2563eb" : "#ea580c",
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
        });

        new sdk.Marker({
          map,
          position: new sdk.LatLng(origin.lat, origin.lng),
          title: "출발지: " + origin.name,
        });
        new sdk.Marker({
          map,
          position: new sdk.LatLng(destination.lat, destination.lng),
          title: "도착지: " + destination.name,
        });

        const sw = new sdk.LatLng(Math.min(...latitudes), Math.min(...longitudes));
        const ne = new sdk.LatLng(Math.max(...latitudes), Math.max(...longitudes));
        map.fitBounds(new sdk.LatLngBounds(sw, ne));
        setStatus("ready");
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "경로 지도를 표시하지 못했습니다.");
          setStatus("error");
        }
      }
    }

    void drawRoute();
    return () => { cancelled = true; };
  }, [open, origin.name, origin.lat, origin.lng, destination.name, destination.lat, destination.lng, roundTrip]);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button
        type="button"
        className="w-full px-5 py-4 text-left text-sm font-bold text-blue-700 hover:bg-slate-50"
        aria-expanded={open}
        onClick={() => {
          setOpen((previous) => !previous);
          setStatus("loading");
          setError("");
        }}
      >
        {open ? "▲ 경로 지도 닫기" : "▼ 지도에서 실제 이동 경로 보기"}
      </button>
      {open && (
        <div className="border-t border-slate-100 p-3">
          {status === "loading" && (
            <p role="status" className="mb-3 text-sm text-slate-500">도로 경로와 지도를 불러오는 중...</p>
          )}
          {status === "error" && (
            <p role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </p>
          )}
          <div
            ref={containerRef}
            aria-label="자동차 이동 경로 지도"
            className="h-72 w-full rounded-xl bg-slate-100"
            style={{ display: status === "error" ? "none" : "block" }}
          />
          {status === "ready" && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              파란색은 가는 길{roundTrip ? ", 주황색은 오는 길" : ""}입니다. 실제 도로 상황에 따라 경로가 달라질 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
