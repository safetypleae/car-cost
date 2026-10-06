import Link from "next/link";

const faqs = [
  {
    question: "차비에는 어떤 비용이 포함되나요?",
    answer:
      "현재 차비얼마의 예상 차비는 주행에 필요한 연료비와 경로 조회에서 확인한 통행료를 합산합니다. 주차비, 세차비, 보험료, 차량 감가상각비처럼 운행마다 바로 발생하지 않는 비용은 현재 총액에 포함하지 않습니다.",
  },
  {
    question: "기름값은 어떤 가격을 사용하나요?",
    answer:
      "출발지 주변 주유소의 유가 정보를 조회해 평균 가격을 적용합니다. 조회가 어렵거나 실제로 이용할 주유소 가격이 따로 있다면 사용자가 원/L 값을 직접 수정할 수 있습니다.",
  },
  {
    question: "차량을 선택하지 않아도 계산할 수 있나요?",
    answer:
      "가능합니다. 차량을 검색하면 공식 표시연비를 불러와 편하게 입력할 수 있고, 차량을 선택하지 않는 경우에는 본인이 알고 있는 실제 연비를 직접 입력하면 됩니다.",
  },
  {
    question: "계산 결과와 실제 결제 금액이 다른 이유는 무엇인가요?",
    answer:
      "실제 연비는 정체, 운전 습관, 냉난방 사용, 적재량, 타이어 상태 등에 따라 달라집니다. 경로와 통행료, 주유 가격도 시점과 조건에 따라 변할 수 있으므로 결과는 이동 전 예산을 비교하기 위한 예상값으로 이용하는 것이 좋습니다.",
  },
];

export default function HomeGuideContent() {
  return (
    <section className="mt-8 space-y-6" aria-labelledby="cost-guide-title">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          자동차 이동비 계산 가이드
        </p>
        <h2 id="cost-guide-title" className="mt-2 text-2xl font-bold tracking-tight">
          자동차로 이동할 때 실제로 얼마가 들까요?
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          자동차 이동비는 단순히 거리만 보고 정하기 어렵습니다. 같은 100km를
          이동해도 차량 연비와 유종, 출발지 주변의 기름값, 유료도로 이용 여부에
          따라 비용이 달라집니다. 차비얼마는 이런 조건을 한 번에 모아 연료비와
          통행료를 계산하고, 여러 명이 함께 탈 때는 1인당 부담액까지 보여주는
          이동비 계산기입니다.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          여행이나 장거리 약속을 잡을 때 “차로 가는 게 나을까?”, “기름값을
          얼마씩 나누면 될까?”를 빠르게 판단하는 용도로 사용할 수 있습니다.
          계산 결과는 실제 결제 금액을 보장하는 값이 아니라 현재 입력 조건을
          기준으로 한 예상 비용입니다.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">차비는 이렇게 계산합니다</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
          <div>
            <h3 className="font-bold text-slate-900">1. 실제 주행거리를 확인합니다</h3>
            <p className="mt-1">
              출발지와 목적지를 검색하면 도로 경로를 기준으로 이동 거리와 예상
              소요시간을 조회합니다. 왕복을 선택하면 가는 길과 오는 길을 각각
              계산해 전체 거리를 합산합니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">2. 거리와 연비로 필요한 연료량을 구합니다</h3>
            <p className="mt-1">
              기본 계산식은 <strong className="text-slate-900">주행거리 ÷ 연비 = 예상 연료 사용량</strong>입니다.
              예를 들어 120km를 연비 12km/L인 차량으로 이동한다면 약 10L의
              연료가 필요하다고 계산합니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">3. 현재 유가를 적용해 연료비를 계산합니다</h3>
            <p className="mt-1">
              예상 연료 사용량에 적용 유가를 곱해 연료비를 구합니다. 차비얼마는
              출발지 주변 유가를 자동으로 조회하지만, 실제 주유 가격을 알고 있다면
              직접 수정해서 비교할 수도 있습니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">4. 통행료를 더하고 인원수로 나눕니다</h3>
            <p className="mt-1">
              최종 예상 차비는 연료비에 통행료를 더해 계산합니다. 동승자가 있다면
              총액을 탑승 인원으로 나눈 1인당 예상 부담액도 함께 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-blue-50 p-6 ring-1 ring-blue-100">
        <h2 className="text-xl font-bold text-slate-900">연비는 공인연비보다 실제 연비가 더 정확할 수 있어요</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          차량 검색에서 제공하는 표시연비는 차량별 기준값을 빠르게 입력하기 위한
          참고 자료입니다. 하지만 막히는 도심 주행, 고속도로 주행 비율, 급가속과
          급제동, 냉난방 사용 등에 따라 실제 연비는 달라질 수 있습니다. 평소
          계기판이나 주유 기록으로 알고 있는 실제 연비가 있다면 그 값을 직접
          입력하는 편이 본인의 운행 비용을 추정하는 데 더 유용할 수 있습니다.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">이럴 때 차비얼마를 활용해보세요</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <li><strong className="text-slate-900">장거리 여행:</strong> 출발 전에 왕복 기름값과 톨비를 함께 잡아 여행 교통비 예산을 계산할 때</li>
          <li><strong className="text-slate-900">친구들과 카풀:</strong> 운전자 한 명이 비용을 모두 부담하지 않도록 1인당 금액을 빠르게 나눌 때</li>
          <li><strong className="text-slate-900">출퇴근·반복 이동:</strong> 특정 구간을 자동차로 이동할 때 한 번의 주행에 어느 정도 비용이 드는지 확인할 때</li>
          <li><strong className="text-slate-900">차량 비교:</strong> 같은 경로에서 연비가 다른 차량의 예상 연료비 차이를 비교할 때</li>
        </ul>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">자주 묻는 질문</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {faqs.map((item) => (
            <div key={item.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-bold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">
          사용 데이터와 계산 범위를 더 자세히 확인하려면{" "}
          <Link href="/methodology" className="font-semibold text-blue-600 hover:underline">
            계산 기준·데이터 출처
          </Link>
          를 확인하세요.
        </p>
      </div>
    </section>
  );
}
