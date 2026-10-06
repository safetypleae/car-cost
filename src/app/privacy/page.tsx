import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 차비얼마",
  description: "차비얼마의 개인정보 및 브라우저 저장정보, 광고 쿠키 관련 처리방침입니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage title="개인정보처리방침" description="차비얼마는 서비스 제공에 필요한 범위에서 정보를 처리하며, 이용자가 이해하기 쉽도록 주요 처리 내용을 안내합니다.">
      <p className="text-sm text-slate-500">시행일: 2026년 10월 6일</p>
      <section>
        <h2 className="text-xl font-bold">1. 최근 계산 정보</h2>
        <p className="mt-2 text-slate-600">최근 계산 기능을 위해 출발지·목적지, 차량/연비, 유종, 탑승 인원 및 계산 결과가 이용자의 브라우저 LocalStorage에 저장될 수 있습니다. 현재 최근 계산 정보는 서버 계정에 저장하는 방식이 아니며, 이용자가 최근 계산을 삭제하거나 브라우저 저장정보를 삭제하면 제거할 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">2. 공유 링크</h2>
        <p className="mt-2 text-slate-600">공유 기능을 사용하면 계산 조건이 URL에 포함될 수 있습니다. 생성된 공유 링크를 다른 사람에게 전달하면 링크에 포함된 출발지, 목적지, 차량 및 계산 조건을 링크를 받은 사람이 확인할 수 있으므로 공개를 원하지 않는 정보가 포함되지 않았는지 확인해 주세요.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">3. 외부 데이터 서비스</h2>
        <p className="mt-2 text-slate-600">차비얼마는 장소 검색, 경로, 유가, 차량 연비 정보를 제공하기 위해 외부 API를 사용합니다. 서비스 운영 과정에서 요청 처리에 필요한 정보가 각 제공자의 정책에 따라 처리될 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">4. 광고 및 쿠키</h2>
        <p className="mt-2 text-slate-600">차비얼마에 Google AdSense 등 제3자 광고 서비스가 적용되는 경우 Google을 포함한 제3자 공급업체는 광고 제공, 빈도 제한, 성과 측정 및 개인화 등에 쿠키, 웹 비콘, IP 주소 또는 기타 식별 기술을 사용할 수 있습니다. Google의 광고 쿠키 사용으로 이용자의 이 사이트 또는 다른 사이트 방문 기록을 바탕으로 광고가 제공될 수 있습니다.</p>
        <p className="mt-2 text-slate-600">이용자는 Google 광고 설정에서 개인 맞춤 광고 관련 설정을 관리할 수 있습니다. 적용되는 동의 절차와 선택 기능은 이용 지역 및 관련 법령, 광고 서비스 설정에 따라 달라질 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">5. 보관 및 변경</h2>
        <p className="mt-2 text-slate-600">서비스 기능이나 적용되는 외부 서비스가 변경되면 본 방침도 변경될 수 있으며, 중요한 변경사항은 이 페이지에 반영합니다.</p>
      </section>
      <aside className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">현재 별도의 회원가입 기능은 제공하지 않습니다. 향후 회원 기능, 분석 도구, 광고 또는 문의 접수 방식이 추가되면 실제 처리 내용에 맞춰 이 방침을 업데이트합니다.</aside>
    </InfoPage>
  );
}
