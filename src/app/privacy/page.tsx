
import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 차비얼마",
  description:
    "차비얼마 웹사이트 및 모바일 앱의 개인정보 처리, 기기 내 저장정보, 외부 API 및 광고 관련 안내입니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="개인정보처리방침"
      description="차비얼마는 웹사이트와 모바일 앱의 서비스 제공에 필요한 범위에서 정보를 처리하며, 이용자가 이해하기 쉽도록 주요 처리 내용을 안내합니다."
    >
      <p className="text-sm text-slate-500">
        시행일: 2026년 10월 8일
      </p>

      <section>
        <h2 className="text-xl font-bold">
          1. 적용 대상
        </h2>
        <p className="mt-2 text-slate-600">
          본 개인정보처리방침은 차비얼마 웹사이트
          (car-cost.kr)와 Android 및 iOS 모바일 앱에
          적용됩니다. 차비얼마는 현재 별도의 회원가입이나
          로그인 기능을 제공하지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          2. 웹사이트 저장정보
        </h2>
        <p className="mt-2 text-slate-600">
          최근 계산 기능을 위해 출발지·목적지,
          차량 및 연비, 연료 종류, 탑승 인원,
          계산 결과 등이 이용자의 브라우저
          LocalStorage에 저장될 수 있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          이러한 정보는 회원 계정에 저장되는 방식이
          아니며, 이용자가 최근 계산 기록을 삭제하거나
          브라우저 저장정보를 삭제하여 제거할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          3. 모바일 앱 저장정보
        </h2>
        <p className="mt-2 text-slate-600">
          모바일 앱에서는 내 차 정보(차량 이름,
          연료 종류, 연비)와 즐겨찾기 경로
          (출발지·목적지 및 관련 좌표)를
          기기 내부 저장소에 저장할 수 있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          해당 정보는 앱의 로컬 저장 기능을 통해
          보관되며, 별도의 회원 계정에 저장되지 않습니다.
          이용자는 앱에서 저장된 차량이나 경로를
          삭제할 수 있습니다. 앱 삭제 시에도 일반적으로
          로컬 데이터가 제거되지만, 기기 백업 및 복원
          설정에 따라 처리 방식이 달라질 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          4. 서비스 이용 중 정보 전송
        </h2>
        <p className="mt-2 text-slate-600">
          장소 검색, 경로 계산, 주변 유가 및 주차장
          조회, 차량 공인연비 검색을 위해 검색어,
          출발지·목적지 좌표, 연료 종류, 차량 검색
          조건 등 요청 처리에 필요한 정보가
          차비얼마 서버로 전송될 수 있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          차비얼마는 카카오, 네이버, 오피넷 및
          공공데이터 기반 서비스를 활용합니다.
          기능 제공에 필요한 정보는 각 외부
          서비스의 처리 과정에 따라 전달될 수
          있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          서비스 접속 및 API 요청 과정에서 IP 주소,
          요청 시각 등 기술적 정보가 서버 또는
          인프라 제공자의 운영 로그에 기록될 수
          있습니다. 실제 로그 보관 기간과 처리 방식은
          운영 환경의 설정에 따릅니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          5. 계산 결과 공유
        </h2>
        <p className="mt-2 text-slate-600">
          웹사이트의 공유 링크에는 출발지·목적지,
          차량 및 계산 조건이 URL에 포함될 수 있습니다.
          링크를 전달받은 사람은 해당 정보를 확인할 수
          있으므로 공유 전에 내용을 확인해 주세요.
        </p>
        <p className="mt-2 text-slate-600">
          모바일 앱에서는 기기의 기본 공유 기능을
          통해 계산 결과를 다른 앱으로 전달할 수
          있습니다. 이용자가 선택한 공유 대상
          서비스의 개인정보 처리방침이 별도로
          적용될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          6. 광고 및 쿠키
        </h2>
        <p className="mt-2 text-slate-600">
          웹사이트에 Google AdSense 등 제3자 광고
          서비스가 적용되는 경우 광고 제공, 빈도 제한,
          성과 측정 및 개인화 등을 위해 쿠키,
          IP 주소 또는 기타 식별 기술이 사용될 수
          있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          모바일 앱에는 향후 Google AdMob 광고
          서비스가 도입될 수 있습니다. 광고 SDK가
          실제 적용되는 경우 수집·공유되는 데이터,
          광고 식별자 사용 여부, 이용자 동의 및
          선택 방법을 확인하여 본 방침을
          업데이트합니다.
        </p>
        <p className="mt-2 text-slate-600">
          이용자는 Google 광고 설정 등 제공되는
          수단을 통해 개인 맞춤 광고 관련 설정을
          관리할 수 있습니다. 적용되는 동의 절차는
          이용 지역, 관련 법령 및 광고 서비스
          설정에 따라 달라질 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          7. 정보 보관 및 삭제
        </h2>
        <p className="mt-2 text-slate-600">
          이용자의 기기에 저장된 계산 및 차량·경로
          정보는 이용자가 삭제할 수 있습니다.
          서버와 외부 서비스에서 처리되는 기술적
          정보의 보관 및 삭제는 실제 운영 설정과
          관련 정책에 따라 달라질 수 있습니다.
        </p>
        <p className="mt-2 text-slate-600">
          개인정보 관련 문의 또는 삭제 요청은
          차비얼마 문의 페이지를 통해 접수할 수
          있습니다.
        </p>
        <p className="mt-2">
          <a
            href="/contact"
            className="font-semibold text-emerald-700 underline"
          >
            차비얼마 문의 페이지
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          8. 개인정보처리방침 변경
        </h2>
        <p className="mt-2 text-slate-600">
          서비스 기능, 외부 API, 광고 SDK 또는
          개인정보 처리 방식이 변경되면 실제
          처리 내용에 맞춰 본 방침을 수정하고
          시행일을 안내합니다.
        </p>
      </section>

      <aside className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
        차비얼마는 현재 별도의 회원가입 기능을
        제공하지 않습니다. 향후 회원 기능,
        분석 도구 또는 광고 서비스가 추가되면
        실제 개인정보 처리 내용을 확인하여
        본 방침을 업데이트합니다.
      </aside>
    </InfoPage>
  );
}
