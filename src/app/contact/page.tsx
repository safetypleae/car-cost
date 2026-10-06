import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "문의 | 차비얼마",
  description: "차비얼마의 계산 오류, 데이터 수정, 기능 제안 및 서비스 관련 문의 안내입니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPage title="문의" description="계산 오류, 데이터 문제, 기능 제안 등 차비얼마를 이용하면서 발견한 내용을 알려주세요.">
      <section>
        <h2 className="text-xl font-bold">문의할 때 함께 알려주면 좋은 정보</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>출발지와 목적지</li>
          <li>편도/왕복 여부</li>
          <li>선택한 차량 또는 입력한 연비</li>
          <li>화면에 표시된 오류 문구나 이상한 계산값</li>
          <li>사용한 브라우저와 기기 종류</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">문의 채널 준비 중</h2>
        <p className="mt-2 text-slate-600">현재 전용 문의 폼과 공개 문의 이메일을 준비하고 있습니다. 문의 채널이 확정되면 이 페이지에 바로 안내하겠습니다.</p>
      </section>
      <aside className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">주유소 가격이나 도로 통행료처럼 외부 기관이 제공하는 원천 데이터 자체에 관한 문의는 해당 데이터 제공기관의 최신 안내도 함께 확인해 주세요.</aside>
    </InfoPage>
  );
}
