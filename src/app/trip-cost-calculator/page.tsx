import type { Metadata } from "next";
import CalculatorShell from "@/components/CalculatorShell";
import { TripCostCalculator } from "@/components/SimpleCalculators";

export const metadata: Metadata = {
  title: "기름값 + 통행료 자동차 여행비 계산",
  description: "총 주행거리, 차량 연비, 유가와 통행료를 입력해 자동차 여행의 예상 이동비와 1인당 비용을 계산합니다.",
  alternates: { canonical: "/trip-cost-calculator" },
  openGraph: {
    title: "기름값 + 통행료 자동차 여행비 계산 | 차비얼마",
    description: "총 주행거리, 차량 연비, 유가와 통행료를 입력해 자동차 여행의 예상 이동비와 1인당 비용을 계산합니다.",
    url: "/trip-cost-calculator",
  },
};

const faqJsonLd = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "자동차 여행비에는 무엇이 포함되나요?", "acceptedAnswer": {"@type": "Answer", "text": "이 계산기에서는 예상 기름값과 입력한 통행료를 합산합니다."}}, {"@type": "Question", "name": "주차비도 포함되나요?", "acceptedAnswer": {"@type": "Answer", "text": "이 페이지에는 주차비가 포함되지 않습니다. 주차비가 있다면 계산 결과에 별도로 더해 실제 예산을 잡는 것이 좋습니다."}}, {"@type": "Question", "name": "실제 경로의 통행료를 모르면 어떻게 하나요?", "acceptedAnswer": {"@type": "Answer", "text": "차비얼마 메인 계산기에서 실제 출발지와 목적지를 선택하면 예상 통행료까지 함께 확인할 수 있습니다."}}]};

export default function Page() {
  return (
    <CalculatorShell eyebrow="여행비 계산기" title="기름값 + 통행료 자동차 여행비 계산" description="총 주행거리, 차량 연비, 유가와 통행료를 입력해 자동차 여행의 예상 이동비와 1인당 비용을 계산합니다.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <TripCostCalculator />

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
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">자동차 여행비에는 무엇이 포함되나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">이 계산기에서는 예상 기름값과 입력한 통행료를 합산합니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">주차비도 포함되나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">이 페이지에는 주차비가 포함되지 않습니다. 주차비가 있다면 계산 결과에 별도로 더해 실제 예산을 잡는 것이 좋습니다.</p></div>
          <div className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">실제 경로의 통행료를 모르면 어떻게 하나요?</h3><p className="mt-2 text-sm leading-7 text-slate-600">차비얼마 메인 계산기에서 실제 출발지와 목적지를 선택하면 예상 통행료까지 함께 확인할 수 있습니다.</p></div>
        </div>
      </section>
    </CalculatorShell>
  );
}
