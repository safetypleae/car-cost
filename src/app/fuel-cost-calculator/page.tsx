import type { Metadata } from "next";
import CalculatorShell from "@/components/CalculatorShell";
import { FuelCostCalculator } from "@/components/SimpleCalculators";

export const metadata: Metadata = {
  title: "거리·연비·유가로 자동차 주유비 계산",
  description: "주행거리와 차량 연비, 리터당 유가를 입력해 예상 기름값과 사용 연료량, 인원별 부담액을 계산합니다.",
  alternates: { canonical: "/fuel-cost-calculator" },
  openGraph: {
    title: "거리·연비·유가로 자동차 주유비 계산 | 차비얼마",
    description: "주행거리와 차량 연비, 리터당 유가를 입력해 예상 기름값과 사용 연료량, 인원별 부담액을 계산합니다.",
    url: "/fuel-cost-calculator",
  },
};

const faqJsonLd = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "기름값은 어떻게 계산하나요?", "acceptedAnswer": {"@type": "Answer", "text": "주행거리 ÷ 차량 연비로 예상 연료 사용량을 구한 뒤 리터당 유가를 곱합니다."}}, {"@type": "Question", "name": "왕복 기름값도 계산할 수 있나요?", "acceptedAnswer": {"@type": "Answer", "text": "왕복 옵션을 선택하면 입력한 편도 거리를 두 배로 계산합니다."}}, {"@type": "Question", "name": "실제 기름값과 차이가 날 수 있나요?", "acceptedAnswer": {"@type": "Answer", "text": "교통상황, 운전습관, 공조장치 사용, 적재량과 실제 주유 가격에 따라 차이가 날 수 있습니다."}}]};

export default function Page() {
  return (
    <CalculatorShell eyebrow="기름값 계산기" title="거리·연비·유가로 자동차 주유비 계산" description="주행거리와 차량 연비, 리터당 유가를 입력해 예상 기름값과 사용 연료량, 인원별 부담액을 계산합니다.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <FuelCostCalculator />

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
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">기름값은 어떻게 계산하나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">주행거리 ÷ 차량 연비로 예상 연료 사용량을 구한 뒤 리터당 유가를 곱합니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">왕복 기름값도 계산할 수 있나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">왕복 옵션을 선택하면 입력한 편도 거리를 두 배로 계산합니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">실제 기름값과 차이가 날 수 있나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">교통상황, 운전습관, 공조장치 사용, 적재량과 실제 주유 가격에 따라 차이가 날 수 있습니다.</p></div>
        </div>
      </section>
    </CalculatorShell>
  );
}
