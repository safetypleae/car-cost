import Link from "next/link";
import type { ReactNode } from "react";

export default function CalculatorShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 text-sm text-slate-500" aria-label="경로">
          <Link href="/" className="font-semibold text-blue-600 hover:underline">차비얼마</Link>
          <span className="mx-2">/</span>
          <Link href="/tools" className="font-semibold text-blue-600 hover:underline">계산 도구</Link>
          <span className="mx-2">/</span>
          <span>{title}</span>
        </nav>

        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-bold text-blue-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        </header>

        {children}

        <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">실제 출발지와 목적지까지 계산하려면?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            차비얼마 메인 계산기에서는 실제 장소를 검색해 주행거리, 예상 시간,
            현재 유가, 통행료와 인원별 차비를 한 번에 계산할 수 있습니다.
          </p>
          <Link href="/" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100 sm:w-auto">
            실제 경로로 계산하기
          </Link>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          <Link href="/tools" className="hover:text-slate-900 hover:underline">다른 계산 도구</Link>
          <span className="mx-3">·</span>
          <Link href="/methodology" className="hover:text-slate-900 hover:underline">계산 기준·데이터 출처</Link>
        </footer>
      </div>
    </main>
  );
}
