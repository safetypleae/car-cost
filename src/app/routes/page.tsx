import type { Metadata } from "next";
import Link from "next/link";
import { routeGuides as baseRouteGuides } from "@/data/route-guides";
import { extraRouteGuides } from "@/data/route-guides-extra";

const routeGuides = [...baseRouteGuides, ...extraRouteGuides];

export const metadata: Metadata = {
  title: "주요 자동차 이동비 계산 경로",
  description:
    "서울, 부산, 대구, 광주 등 주요 도시와 공항·여행 구간의 자동차 이동비 계산 가이드를 모았습니다. 원하는 경로를 선택하고 정확한 출발지와 목적지는 차비얼마 계산기에서 검색하세요.",
  alternates: {
    canonical: "/routes",
  },
};

function isAirportRoute(origin: string, destination: string) {
  return origin.includes("공항") || destination.includes("공항");
}

export default function RoutesPage() {
  const seoulRoutes = routeGuides.filter((route) => route.origin === "서울");
  const busanRoutes = routeGuides.filter((route) => route.origin === "부산");
  const airportRoutes = routeGuides.filter((route) =>
    isAirportRoute(route.origin, route.destination),
  );
  const otherRoutes = routeGuides.filter(
    (route) =>
      route.origin !== "서울" &&
      route.origin !== "부산" &&
      !isAirportRoute(route.origin, route.destination),
  );

  const groups = [
    {
      title: "서울 출발 주요 경로",
      description: "서울에서 전국 주요 도시와 여행지로 이동하는 자동차 경로입니다.",
      routes: seoulRoutes,
    },
    {
      title: "부산 출발 주요 경로",
      description: "부산에서 영남권 주요 도시와 여행지로 이동하는 경로입니다.",
      routes: busanRoutes,
    },
    {
      title: "공항 이동 경로",
      description: "공항 픽업·샌딩이나 여행 출발 전 자동차 이동비를 확인해보세요.",
      routes: airportRoutes,
    },
    {
      title: "지역 간 주요 이동 경로",
      description: "지역 도시 사이의 여행·방문·업무 이동에 활용할 수 있는 경로입니다.",
      routes: otherRoutes,
    },
  ].filter((group) => group.routes.length > 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-slate-500" aria-label="경로">
          <Link href="/" className="font-semibold text-blue-600 hover:underline">
            차비얼마
          </Link>
          <span className="mx-2">/</span>
          <span>주요 경로</span>
        </nav>

        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-bold text-blue-600">자동차 이동비 경로 모음</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            주요 자동차 이동비 계산 경로
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            자주 이동하는 도시·공항·여행 구간을 골라 자동차 이동비 계산 방법을
            확인할 수 있습니다. 실제 계산에서는 도시 이름만 사용하는 대신 정확한
            출발 장소와 목적지를 직접 검색해 현재 조건에 맞는 예상 비용을
            확인하세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            정확한 출발지·목적지로 계산하기
          </Link>
        </header>

        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section
              key={group.title}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
            >
              <h2 className="text-xl font-bold">{group.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {group.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {group.routes.map((route) => (
                  <Link
                    key={route.slug}
                    href={`/routes/${route.slug}`}
                    className="group rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {route.origin} → {route.destination}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          기름값·톨비·인원별 차비 계산
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="text-lg text-slate-300 transition group-hover:text-blue-600"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">목록에 없는 경로도 계산할 수 있어요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            차비얼마 계산기에서 건물명, 역, 공항, 관광지, 주소 등 실제 장소를
            검색해 원하는 자동차 이동 경로의 예상 비용을 계산할 수 있습니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
          >
            차비얼마 계산기 열기
          </Link>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          <Link href="/methodology" className="hover:text-slate-900 hover:underline">
            계산 기준·데이터 출처
          </Link>
          <span className="mx-3">·</span>
          <Link href="/" className="hover:text-slate-900 hover:underline">
            차비얼마 홈
          </Link>
        </footer>
      </div>
    </main>
  );
}
