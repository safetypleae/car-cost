import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function InfoPage({ title, description, children }: Props) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
          ← 차비얼마 계산기로 돌아가기
        </Link>
        <header className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
        </header>
        <article className="mt-5 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 leading-7 shadow-sm sm:p-8">
          {children}
        </article>
        <SiteFooter />
      </div>
    </main>
  );
}
