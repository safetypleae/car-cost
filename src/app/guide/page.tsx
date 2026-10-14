import InfoPage from "@/components/InfoPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "이용방법",
  description: "출발지와 목적지, 차량 연비와 탑승 인원을 입력해 자동차 이동비를 계산하는 차비얼마 이용방법입니다.",
  path: "/guide",
});

export default function GuidePage() {
  return (
    <InfoPage title="차비얼마 이용방법" description="출발지와 목적지를 정하면 기름값, 통행료와 선택한 주차비를 합친 예상 자동차 이동비를 빠르게 확인할 수 있습니다.">
      <section>
        <h2 className="text-xl font-bold">1. 출발지와 목적지를 선택하세요</h2>
        <p className="mt-2 text-slate-600">장소 이름을 두 글자 이상 입력한 뒤 검색 결과에서 정확한 장소를 선택합니다. 같은 이름의 장소가 여러 곳일 수 있으므로 주소도 함께 확인하는 것이 좋습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">2. 편도 또는 왕복을 선택하세요</h2>
        <p className="mt-2 text-slate-600">왕복은 출발지에서 목적지로 가는 경로와 목적지에서 다시 출발지로 돌아오는 경로를 각각 조회해 거리, 시간, 통행료를 합산합니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">3. 차량 또는 연비를 설정하세요</h2>
        <p className="mt-2 text-slate-600">차량명을 검색하면 제공되는 공식 표시연비를 불러올 수 있습니다. 실제 운전 환경과 차이가 있다면 본인 차량의 실연비를 직접 입력해 계산할 수도 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">4. 주차비와 탑승 인원을 설정하고 계산하세요</h2>
        <p className="mt-2 text-slate-600">주차비를 제외하거나 목적지 주변 공영주차장 요금을 참고해 입력할 수 있습니다. 예상 기름값, 통행료와 주차비를 합친 총 이동비와 탑승 인원으로 나눈 1인당 예상 비용을 확인하세요.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">5. 주유소를 비교하거나 출장 서류를 만드세요</h2>
        <p className="mt-2 text-slate-600">계산 결과가 나오면 경로상 주유소 후보의 가격과 우회 비용을 비교할 수 있습니다. 업무 이동이라면 계산값에 실제 지출액과 출장 정보를 더해 Excel 또는 PDF 운행일지·경비정산서를 브라우저에서 만들 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">최근 계산과 공유</h2>
        <p className="mt-2 text-slate-600">최근 계산은 현재 브라우저에 최대 5개까지 저장됩니다. 공유 기능을 사용하면 계산 조건이 포함된 링크를 만들어 다른 사람과 같은 결과를 확인할 수 있습니다.</p>
      </section>
      <aside className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        계산과 주유소 비교 결과는 예상값이며, 생성한 출장 서류는 회사의 지급 확정 문서가 아닙니다. 실제 주행 경로, 정체, 우회, 차량 상태, 운전 습관, 가격 갱신 시점과 회사 규정에 따라 결과는 달라질 수 있습니다.
      </aside>
    </InfoPage>
  );
}
