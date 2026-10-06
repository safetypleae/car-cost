import type { Metadata } from "next";
import CalculatorShell from "@/components/CalculatorShell";
import { CommuteCostCalculator } from "@/components/SimpleCalculators";

export const metadata: Metadata = {
  title: "월·연간 자동차 출퇴근 비용 계산",
  description: "하루 왕복거리와 월 출근일, 차량 연비, 유가, 주차비를 입력해 월간·연간 자동차 출퇴근 비용을 계산합니다.",
  alternates: { canonical: "/commute-cost-calculator" },
  openGraph: {
    title: "월·연간 자동차 출퇴근 비용 계산 | 차비얼마",
    description: "하루 왕복거리와 월 출근일, 차량 연비, 유가, 주차비를 입력해 월간·연간 자동차 출퇴근 비용을 계산합니다.",
    url: "/commute-cost-calculator",
  },
};

const faqJsonLd = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "월 출퇴근 비용은 어떻게 계산하나요?", "acceptedAnswer": {"@type": "Answer", "text": "하루 왕복거리 × 월 출근일로 월 주행거리를 구하고, 연비와 유가로 기름값을 계산한 뒤 입력한 주차비를 더합니다."}}, {"@type": "Question", "name": "연간 비용은 어떻게 계산하나요?", "acceptedAnswer": {"@type": "Answer", "text": "현재 계산기는 월 예상비용에 12개월을 곱해 연간 예상비용을 보여줍니다."}}, {"@type": "Question", "name": "보험료와 차량 감가상각도 포함되나요?", "acceptedAnswer": {"@type": "Answer", "text": "아닙니다. 현재 결과는 연료비와 입력한 주차비 중심의 이동비 추정치입니다."}}]};

export default function Page() {
  return (
    <CalculatorShell eyebrow="출퇴근 비용 계산기" title="월·연간 자동차 출퇴근 비용 계산" description="하루 왕복거리와 월 출근일, 차량 연비, 유가, 주차비를 입력해 월간·연간 자동차 출퇴근 비용을 계산합니다.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <CommuteCostCalculator />

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">계산 기준</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          이 도구는 입력한 값을 바탕으로 빠르게 예산을 잡기 위한 계산기입니다.
          실제 비용은 차량 상태, 교통상황, 선택 경로, 실제 주유 가격과 이용 조건에 따라 달라질 수 있습니다.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">자주 묻는 질문</h2>
        <div className="mt-4 divide-y divide-slate-100">
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">월 출퇴근 비용은 어떻게 계산하나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">하루 왕복거리 × 월 출근일로 월 주행거리를 구하고, 연비와 유가로 기름값을 계산한 뒤 입력한 주차비를 더합니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">연간 비용은 어떻게 계산하나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">현재 계산기는 월 예상비용에 12개월을 곱해 연간 예상비용을 보여줍니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">보험료와 차량 감가상각도 포함되나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">아닙니다. 현재 결과는 연료비와 입력한 주차비 중심의 이동비 추정치입니다.</p></div>
        </div>
      </section>
    </CalculatorShell>
  );
}
