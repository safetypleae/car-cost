import type { Metadata } from "next";
import CalculatorShell from "@/components/CalculatorShell";
import { CarpoolCalculator } from "@/components/SimpleCalculators";

export const metadata: Metadata = {
  title: "카풀 차비 계산기 | 기름값·톨비·주차비 N명 정산",
  description:
    "주행거리, 연비, 유가, 통행료, 주차비를 입력해 카풀 총비용과 1인당 차비를 계산합니다. 균등분담 또는 운전자 제외 정산을 선택할 수 있습니다.",
  alternates: { canonical: "/carpool-calculator" },
  openGraph: {
    title: "카풀 차비 계산기 | 차비얼마",
    description:
      "기름값, 통행료, 주차비를 합산하고 운전자 포함 균등분담 또는 운전자 제외 방식으로 카풀 차비를 계산합니다.",
    url: "/carpool-calculator",
  },
};

const faqs = [
  {
    question: "카풀 차비는 어떻게 계산하나요?",
    answer:
      "주행거리와 차량 연비, 유가로 예상 기름값을 계산하고 통행료, 주차비, 기타 비용을 더한 뒤 선택한 분담 방식에 따라 나눕니다.",
  },
  {
    question: "운전자는 차비를 내지 않게 계산할 수 있나요?",
    answer:
      "가능합니다. 운전자 제외 방식을 선택하면 운전자 1명의 부담액은 0원으로 보고 나머지 동승자끼리 총 이동비를 나눕니다.",
  },
  {
    question: "왕복 카풀 비용도 계산할 수 있나요?",
    answer:
      "왕복 옵션을 선택하면 입력한 편도 주행거리를 두 배로 계산해 예상 기름값을 구합니다. 통행료와 주차비는 실제 왕복 총액을 입력하면 됩니다.",
  },
  {
    question: "실제 거리와 통행료를 모르면 어떻게 하나요?",
    answer:
      "차비얼마 메인 계산기에서 실제 출발지와 목적지를 검색하면 예상 주행거리, 통행료와 이동비를 먼저 확인할 수 있습니다.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function Page() {
  return (
    <CalculatorShell
      eyebrow="카풀 비용 정산 계산기"
      title="카풀 차비 계산기"
      description="주행거리와 차량 연비부터 기름값, 통행료, 주차비까지 합산해 카풀 총 이동비를 계산하고, 운전자 포함 균등분담 또는 운전자 제외 방식으로 1인당 차비를 바로 확인하세요."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CarpoolCalculator />

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">카풀 비용은 어디까지 포함할까요?</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          단순히 기름값만 나누면 실제 운전자가 부담한 비용과 차이가 커질 수
          있습니다. 장거리 이동이라면 기름값과 통행료를 기본으로 보고,
          목적지에서 발생한 주차비나 함께 부담하기로 한 기타 비용까지 더해
          정산하는 방법이 편리합니다.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          차량 감가상각, 보험료, 정비비처럼 장기적으로 발생하는 차량 유지비는
          이 계산에 포함하지 않습니다. 함께 이동한 한 번의 운행비를 간단하게
          정산하기 위한 계산 결과로 활용하세요.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">분담 방식</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold">모두 똑같이 나누기</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              운전자를 포함한 전체 탑승자가 동일한 금액을 부담합니다. 친구나
              동료끼리 비용을 간단하게 N분의 1 할 때 적합합니다.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold">운전자는 제외하기</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              차량과 운전을 제공한 사람의 부담액을 0원으로 두고 나머지
              동승자가 이동비를 나눕니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">자주 묻는 질문</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-bold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </CalculatorShell>
  );
}
