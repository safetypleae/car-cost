import InfoPage from "@/components/InfoPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "계산 기준·데이터 출처",
  description: "차비얼마의 거리, 소요시간, 통행료, 유가, 차량 표시연비와 자동차 이동비 계산 기준을 안내합니다.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <InfoPage title="계산 기준·데이터 출처" description="차비얼마가 어떤 데이터를 이용하고 자동차 이동비를 어떻게 계산하는지 공개합니다.">
      <section>
        <h2 className="text-xl font-bold">자동차 경로·거리·시간·통행료</h2>
        <p className="mt-2 text-slate-600">자동차 경로 조회에는 NAVER Cloud Platform Maps의 Geocoding 및 Directions 5를 사용합니다. 경로 정보는 조회 시점의 교통 상황과 경로 옵션 등에 따라 달라질 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">출발지 주변 유가</h2>
        <p className="mt-2 text-slate-600">유가 정보는 한국석유공사 오피넷(Opinet) 유가정보 API를 이용합니다. 차비얼마는 출발지 주변 주유소 정보를 조회해 계산에 사용할 유가를 제공합니다. 주유소 가격은 갱신 시점과 실제 방문 시점에 따라 달라질 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">차량 공식 표시연비</h2>
        <p className="mt-2 text-slate-600">차량 검색 시 한국에너지공단의 자동차 표시연비 목록 조회 공공데이터를 이용합니다. 표시연비는 차량의 공식 정보이며 실제 연비는 도로, 기온, 적재량, 운전 습관과 차량 상태 등에 따라 달라질 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">기름값 계산식</h2>
        <div className="mt-2 rounded-2xl bg-slate-100 p-4 font-mono text-sm text-slate-700">예상 사용 연료(L) = 총 주행거리(km) ÷ 연비(km/L)<br />예상 기름값 = 예상 사용 연료 × 적용 유가</div>
      </section>
      <section>
        <h2 className="text-xl font-bold">총 이동비와 1인당 비용</h2>
        <div className="mt-2 rounded-2xl bg-slate-100 p-4 font-mono text-sm text-slate-700">총 예상 차비 = 예상 기름값 + 통행료 + 적용한 주차비<br />1인당 예상 비용 = 총 예상 차비 ÷ 탑승 인원</div>
        <p className="mt-3 text-slate-600">주차비를 제외하면 0원으로 계산하며, 목적지 주변 주차장 정보나 직접 입력한 금액을 선택한 경우에만 총액에 반영합니다. 차량 감가상각, 보험료, 정비비 등은 포함하지 않습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">경로상 주유소 비교와 출장 문서</h2>
        <p className="mt-2 text-slate-600">경로상 주유소 비교는 주유 가격 차이에서 해당 주유소를 경유할 때 추가되는 예상 연료비와 통행료를 반영해 실질 절약액을 계산합니다. 후보 범위와 가격 갱신 시점에 따라 실제 최저가와 다를 수 있습니다.</p>
        <p className="mt-2 text-slate-600">출장 운행일지와 경비정산서의 예상 항목은 계산 결과를 가져오며, 사용자가 실제 지출액을 입력하면 해당 금액을 우선 사용합니다. Excel·PDF 파일은 브라우저에서 생성되며 회사별 증빙 및 지급 기준을 대신하지 않습니다.</p>
      </section>
      <aside className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">차비얼마는 각 데이터 제공기관을 대신하지 않으며, 표시되는 값은 편의를 위한 예상 정보입니다. 중요한 이동·비용 결정 전에는 실제 내비게이션과 해당 기관의 최신 정보를 함께 확인해 주세요.</aside>
    </InfoPage>
  );
}
