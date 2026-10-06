import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "자동차 이동비 계산 도구",
  description: "기름값, 자동차 여행비, 출퇴근 비용, 카풀 차비를 간단하게 계산할 수 있는 차비얼마 무료 계산 도구 모음입니다.",
  alternates: { canonical: "/tools" },
};

const tools = [
  { href: "/fuel-cost-calculator", title: "기름값 계산기", description: "거리·연비·유가로 예상 주유비 계산" },
  { href: "/trip-cost-calculator", title: "여행비 계산기", description: "기름값과 통행료를 합친 자동차 여행비 계산" },
  { href: "/commute-cost-calculator", title: "출퇴근 비용 계산기", description: "월·연간 자동차 출퇴근 비용 계산" },
  { href: "/carpool-calculator", title: "카풀 차비 계산기", description: "여러 명이 함께 탈 때 1인당 차비 계산" },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-slate-500"><Link href="/" className="font-semibold text-blue-600 hover:underline">차비얼마</Link><span className="mx-2">/</span><span>계산 도구</span></nav>
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-bold text-blue-600">무료 자동차 비용 계산기</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">자동차 이동비 계산 도구</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">목적에 맞는 계산기를 골라 필요한 숫자만 입력하세요. 실제 출발지와 목적지를 기준으로 거리와 통행료까지 계산하려면 메인 차비얼마 계산기를 이용하면 됩니다.</p>
        </header>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-300">
              <h2 className="text-lg font-bold group-hover:text-blue-600">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
              <p className="mt-4 text-sm font-bold text-blue-600">계산하기 →</p>
            </Link>
          ))}
        </section>
        <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">실제 경로의 전체 차비가 궁금하다면</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">출발지와 목적지를 검색하면 실제 주행거리, 예상 시간, 유가, 통행료와 인원별 비용을 한 번에 계산할 수 있습니다.</p>
          <Link href="/" className="mt-5 inline-flex rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900">차비얼마 메인 계산기</Link>
        </section>
      </div>
    </main>
  );
}
