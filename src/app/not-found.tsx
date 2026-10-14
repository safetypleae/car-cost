import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-bold text-blue-600">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          주소가 잘못되었거나 페이지가 이동되었을 수 있습니다. 차비 계산기로
          돌아가거나 다른 계산 도구를 확인해보세요.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            차비 계산기로 돌아가기
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-200"
          >
            계산 도구 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
