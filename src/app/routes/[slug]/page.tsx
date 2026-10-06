import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRouteGuide, routeGuides } from "@/data/route-guides";

type RoutePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return routeGuides.map((route) => ({ slug: route.slug }));
}

export async function generateMetadata({
  params,
}: RoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteGuide(slug);

  if (!route) {
    return {};
  }

  const title = `${route.origin} → ${route.destination} 자동차 이동비·기름값·톨비`;
  const description = `${route.origin}에서 ${route.destination}까지 자동차로 갈 때 드는 기름값과 통행료를 차비얼마에서 계산해보세요. 편도·왕복과 탑승 인원별 예상 차비를 확인할 수 있습니다.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/routes/${route.slug}`,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: `/routes/${route.slug}`,
      siteName: "차비얼마",
      title: `${title} | 차비얼마`,
      description,
    },
  };
}

function getRelatedRoutes(currentSlug: string, origin: string, destination: string) {
  const sameOrigin = routeGuides.filter(
    (item) => item.slug !== currentSlug && item.origin === origin,
  );
  const connected = routeGuides.filter(
    (item) =>
      item.slug !== currentSlug &&
      !sameOrigin.some((same) => same.slug === item.slug) &&
      (item.origin === destination ||
        item.destination === origin ||
        item.destination === destination),
  );
  const others = routeGuides.filter(
    (item) =>
      item.slug !== currentSlug &&
      !sameOrigin.some((same) => same.slug === item.slug) &&
      !connected.some((candidate) => candidate.slug === item.slug),
  );

  return [...sameOrigin, ...connected, ...others].slice(0, 6);
}

export default async function RouteGuidePage({ params }: RoutePageProps) {
  const { slug } = await params;
  const route = getRouteGuide(slug);

  if (!route) {
    notFound();
  }

  const relatedRoutes = getRelatedRoutes(
    route.slug,
    route.origin,
    route.destination,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <article className="mx-auto max-w-2xl">
        <nav className="mb-6 text-sm text-slate-500" aria-label="경로">
          <Link href="/" className="font-semibold text-blue-600 hover:underline">
            차비얼마
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/routes"
            className="font-semibold text-blue-600 hover:underline"
          >
            주요 경로
          </Link>
          <span className="mx-2">/</span>
          <span>
            {route.origin} → {route.destination}
          </span>
        </nav>

        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-bold text-blue-600">자동차 이동비 가이드</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {route.origin} → {route.destination}
            <br />
            자동차 이동비 계산
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            {route.summary}
          </p>

          <div className="mt-6 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
            <h2 className="font-bold">실제 이동비는 출발할 때 다시 계산하세요</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              거리와 소요시간은 경로와 교통 상황에 따라 달라지고, 기름값도 계속
              변합니다. 차비얼마 계산기에서 정확한 출발 장소와 목적지를 검색하면
              현재 조건을 기준으로 예상 연료비와 통행료, 인원별 차비를 계산할 수
              있습니다.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              {route.origin} → {route.destination} 차비 계산하기
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-xl font-bold">어떤 비용을 계산하나요?</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              차비얼마는 도로 경로를 기준으로 주행거리와 예상 소요시간을 확인하고,
              입력한 차량 연비와 적용 유가를 이용해 예상 연료 사용량과 연료비를
              계산합니다.
            </p>
            <p>
              경로에서 확인되는 통행료를 연료비에 더해 예상 차비를 계산하며,
              탑승 인원을 입력하면 총액을 나눈 1인당 예상 부담액도 확인할 수
              있습니다. 왕복을 선택하면 돌아오는 경로까지 포함해 계산합니다.
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">기본 계산 흐름</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              주행거리 ÷ 차량 연비 → 예상 연료 사용량 → 적용 유가를 반영한
              연료비 → 통행료 합산 → 탑승 인원별 비용 계산
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-xl font-bold">
            {route.origin}에서 {route.destination} 갈 때 활용하기 좋은 경우
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            {route.situations.map((situation) => (
              <li key={situation} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <span>{situation}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-xl font-bold">계산할 때 확인할 점</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            {route.tips.map((tip) => (
              <li key={tip} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{tip}</span>
              </li>
            ))}
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                계산 결과는 경로, 교통 상황, 유가, 실제 차량 연비 등에 따라
                실제 지출액과 달라질 수 있습니다.
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-xl font-bold">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-slate-100">
            <div className="py-4 first:pt-0">
              <h3 className="text-sm font-bold">
                {route.origin}에서 {route.destination}까지 정확히 얼마가 드나요?
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                정확한 비용은 선택 경로, 차량 연비, 출발 시점의 유가와 통행료에
                따라 달라집니다. 그래서 이 페이지에 고정 금액을 표시하지 않고,
                계산기에서 현재 조건으로 직접 계산하도록 제공하고 있습니다.
              </p>
            </div>
            <div className="py-4">
              <h3 className="text-sm font-bold">왕복 비용도 계산할 수 있나요?</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                가능합니다. 메인 계산기에서 왕복을 선택하면 가는 경로와 돌아오는
                경로를 포함한 전체 거리, 통행료와 예상 차비를 확인할 수 있습니다.
              </p>
            </div>
            <div className="py-4 last:pb-0">
              <h3 className="text-sm font-bold">여러 명이 타면 어떻게 계산하나요?</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                탑승 인원을 설정하면 예상 총비용을 인원수로 나눈 1인당 부담액을
                함께 보여줍니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-blue-600">다른 이동 구간</p>
              <h2 className="mt-1 text-xl font-bold">관련 자동차 이동비 경로</h2>
            </div>
            <Link
              href="/routes"
              className="shrink-0 text-sm font-bold text-blue-600 hover:underline"
            >
              전체 보기
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {relatedRoutes.map((item) => (
              <Link
                key={item.slug}
                href={`/routes/${item.slug}`}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="font-bold">
                  {item.origin} → {item.destination}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  자동차 이동비 계산 가이드
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">현재 조건으로 직접 계산해보세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            정확한 출발 장소와 목적지, 차량 연비, 유종, 탑승 인원을 적용해 실제
            여행 조건에 맞는 예상 차비를 확인할 수 있습니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
          >
            차비얼마 계산기 열기
          </Link>
        </div>

        <footer className="py-8 text-center text-sm text-slate-500">
          <Link href="/routes" className="hover:text-slate-900 hover:underline">
            주요 경로
          </Link>
          <span className="mx-3">·</span>
          <Link href="/methodology" className="hover:text-slate-900 hover:underline">
            계산 기준·데이터 출처
          </Link>
          <span className="mx-3">·</span>
          <Link href="/" className="hover:text-slate-900 hover:underline">
            차비얼마 홈
          </Link>
        </footer>
      </article>
    </main>
  );
}
