import Link from "next/link";

const links = [
  { href: "/guide", label: "이용방법" },
  { href: "/methodology", label: "계산 기준·데이터 출처" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/contact", label: "문의" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="서비스 안내">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900 hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 leading-6">
        차비얼마의 계산 결과는 경로, 교통 상황, 유가, 차량 연비 등 입력·조회 조건에 따른 예상값이며 실제 지출액과 다를 수 있습니다.
      </p>
      <p className="mt-2">© {new Date().getFullYear()} 차비얼마</p>
    </footer>
  );
}
