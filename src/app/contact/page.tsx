
import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "문의 | 차비얼마",
  description:
    "차비얼마의 계산 오류, 데이터 수정, 기능 제안 및 개인정보 관련 문의 안내입니다.",
  alternates: { canonical: "/contact" },
};

const CONTACT_EMAIL = "ljh001029@gmail.com";

export default function ContactPage() {
  const emailSubject = encodeURIComponent("[차비얼마] 서비스 문의");
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${emailSubject}`;

  return (
    <InfoPage
      title="문의"
      description="계산 오류, 데이터 문제, 기능 제안, 개인정보 관련 문의 등을 이메일로 보내주세요."
    >
      <section>
        <h2 className="text-xl font-bold">
          이메일 문의
        </h2>

        <p className="mt-2 text-slate-600">
          차비얼마 웹사이트 및 Android·iOS 앱 이용 중
          궁금한 점이나 오류가 있다면 아래 이메일로
          문의해 주세요.
        </p>

        <p className="mt-4 text-lg font-semibold text-slate-800">
          {CONTACT_EMAIL}
        </p>

        <a
          href={mailto}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          이메일로 문의하기
        </a>

        <p className="mt-3 text-sm text-slate-500">
          버튼을 누르면 기기에 설정된 이메일 앱이
          열립니다. 이메일 앱이 열리지 않는 경우
          위 주소로 직접 메일을 보내주세요.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          문의할 수 있는 내용
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>이동비 계산 오류 및 결과 확인</li>
          <li>장소 검색, 경로, 유가 및 주차장 정보 오류</li>
          <li>차량 공인연비 정보 관련 문의</li>
          <li>새로운 기능 제안 및 개선 요청</li>
          <li>개인정보 처리 및 저장정보 삭제 관련 문의</li>
          <li>기타 서비스 이용 문의</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">
          오류 신고 시 함께 알려주면 좋은 정보
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>출발지와 목적지</li>
          <li>편도 또는 왕복 여부</li>
          <li>선택한 차량이나 입력한 연비</li>
          <li>오류 메시지 또는 이상한 계산 결과</li>
          <li>웹사이트 또는 모바일 앱 이용 여부</li>
          <li>사용한 기기와 브라우저 종류</li>
        </ul>

        <p className="mt-3 text-sm text-slate-500">
          문의 내용에 비밀번호나 불필요한 개인정보는
          포함하지 말아 주세요.
        </p>
      </section>

      <aside className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        주유소 가격이나 도로 통행료 등 외부 기관에서
        제공하는 데이터는 실제 정보와 차이가 있을 수
        있습니다. 원천 데이터에 관한 사항은 해당
        제공기관의 최신 안내도 함께 확인해 주세요.
      </aside>
    </InfoPage>
  );
}
