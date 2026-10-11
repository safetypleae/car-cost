# 차비얼마 웹 기능 · v1.0.1–v1.1.0

## 구현 범위
- `/garage`: 로그인 없는 내 차 등록/수정/삭제. 이름, 연료, 연비. 지출이 있는 차량 삭제는 거부하며 기록을 자동 삭제하지 않는다.
- `/expenses`: 9개 지출 종류, 날짜, 원 단위 금액, 차량, 누적 주행거리(선택), 메모(선택). 추가/수정/확인 후 삭제, 기간 및 차량별 조회, 이번 달 합계, 최근 지출.
- `/statistics`: 이번 달 주유/수리/정비/합계, 기간별 월 추이, 카테고리 비중, 차량 비교, 올해 오늘까지 누적, 월평균. 빈 달도 월평균 분모에 포함. 수정/삭제/다른 탭 변경 즉시 다시 계산.
- 메인: 기존 차량 공인연비 검색 결과를 내 차에 저장. 저장 차량의 연료와 연비를 계산기에 적용. 기존 계산/주차/최근 계산/공유 API는 유지.
- 메인 계산 결과: 자차 1인 비용과 대중교통 요금/시간 비교. 공식 조회 미연결 안내 및 사용자가 지도에서 확인한 비용으로 직접 비교. 직접 입력을 실시간 API 데이터로 표현하지 않는다.

## 기기 저장 및 백업
`localStorage['car-cost-maintenance-v1']`에 `MaintenanceData` JSON 저장. 기존 `car-cost-recent-calculations` 키는 수정하지 않음. 브라우저/기기/앱 간 자동 동기화 없음. 서버/D1/계정 저장 없음.

`src/lib/maintenance.ts`의 타입 및 순수 함수는 React/브라우저 의존성이 없으므로 앱에 재사용할 수 있다.

```ts
type MaintenanceData = { schemaVersion: 1; vehicles: OwnedVehicle[]; expenses: Expense[] };
type OwnedVehicle = { id:string; name:string; fuelType:'gasoline'|'diesel'|'premium'|'lpg'; efficiency:number; sourceVehicleId?:string };
type Expense = { id:string; vehicleId:string; category:'fuel'|'repair'|'maintenance'|'insurance'|'tax'|'wash'|'parking'|'toll'|'other'; date:string; amount:number; odometerKm:number|null; memo:string; createdAt:string; updatedAt:string };
```

- 금액 KRW 정수 > 0, 날짜 로컬 달력 `YYYY-MM-DD`, 누적 주행거리 km, 타임스탬프 ISO, ID UUID.
- JSON 내보내기는 모든 차량/지출을 포함한다. 개인정보를 포함하므로 공유 링크에 싣지 않는다.
- 가져오기는 5MB/100대/10,000건 한도, 필드 및 차량 참조 검증. 알 수 없는 필드는 버림.
- 기존 데이터에 추가 병합. 동일 ID/동일 내용은 중복 방지. 동일 ID/다른 내용은 전체 가져오기 거부. 기존 기록을 덮어쓰거나 삭제하지 않는다.
- 저장권한/공간/잘못된 JSON 문제 시 오류 안내, 기존 저장값 보존. 브라우저 삭제 및 공용 기기 주의 안내.
- 로컬 저장은 암호화된 계정 금고가 아니다. 같은 브라우저 프로필을 사용하는 사람이 볼 수 있으므로 민감한 메모를 넣지 않는다. 다른 탭과 동시에 같은 기록을 수정하는 경우 마지막 저장이 적용된다.

## 대중교통 API 계약
`GET /api/transit?startLng=127&startLat=37&goalLng=127.1&goalLat=37.1`

`TransitResponse`는 `src/lib/transit.ts`를 기준으로 한다:
- `schemaVersion:1`, `status:available|unavailable`, `source:ODsay|null`, `routes`, `message`, `reason?`, `queriedAt`, `tripType:oneway`.
- 경로: `id`, `farePerPerson` KRW 성인 편도, `durationMinutes`, `segments` (walk/bus/subway, 이름/정류장/분).
- 미설정/실패/미지원 시 `routes:[]`; 0원이나 가짜 경로로 대체하지 않는다. 잘못된 국내 좌표는 HTTP 400, 조회 불가는 정상 계약 HTTP 200 + unavailable.
- 요청마다 no-store. 외부 응답은 영구 저장하지 않는다. 외부 호출은 버튼 클릭 시에만 수행.
- **기본 비활성:** `TRANSIT_BASIC_APPROVED=true` 및 비밀 환경변수 `ODSAY_API_KEY` 모두 있어야 호출한다. 이번 작업은 키 발급, 계약, 유료 요금제 활성화나 과금을 하지 않는다.
- 구현은 공식 `searchPubTransPathT` API의 도시내 `result.searchType=0`, `path.info.payment/totalTime`와 `subPath`만 지원.
- 도시간 결과는 터미널 앞뒤 연결 경로의 추가 호출이 필요하므로 완전한 비용으로 표현하지 않는다. 왕복도 역방향 경로가 다르므로 자동 2배하지 않는다. 직접 확인한 왕복 합계를 별도 입력.
- 무료 승인/키 확보 후 실제 공급자 호출 테스트와 호출 한도 보호 설정을 완료한 뒤 활성화할 것. 코드의 존재는 실시간 경로가 운영 중임을 뜻하지 않는다.

## 외부 API 조사 (2026-10-12)
공식 운영정책: https://lab.odsay.com/doc/totalPolicy
- Basic 개인/학생/5인 이하 스타트업 대상, 하루 30회, 기간 제한 없는 무료.
- Standard/Premium은 가격 문의 및 결제/계약, Flex는 후불. 이번 릴리스에서 도입하지 않음.
- 무료 대상/허용 서비스 용도/광고 사이트 이용 조건을 키 발급 시 최종 확인. 운영 정책은 바뀔 수 있음.
공식 응답: https://lab.odsay.com/guide/releaseReference
- 도시간 결과는 출발지→터미널, 터미널→목적지 추가 길찾기가 필요.
- 이번 활성화 비용 0원. 전체 이용자 대상으로 실시간 자동 비교를 운영하려면 적합한 플랜/한도와 운영 보안 검토 필요.

## 앱 후속 작업 (이번 앱 수정 없음)
- 현재 앱은 `SavedCar` 및 즐겨찾기를 AsyncStorage에 별도로 저장하고 웹 API를 사용한다. 기존 필드를 유지하며 OwnedVehicle로 변환할 어댑터 추가.
- 순수 maintenance/transit 타입과 계산 함수 재사용 또는 공유 패키지 분리.
- AsyncStorage 저장 어댑터/스키마 마이그레이션: 기존 내 차를 유지하며 고유 ID 부여. 마이그레이션 전 백업 및 검증.
- RN 가계부/통계 화면, 네이티브 JSON 파일 내보내기/가져오기, 접근성 구현.
- 비교 화면에서 기존 주행 계산 결과 재사용 및 신규 transit 응답 처리. API 미연결/도시간/왕복 실패 안내 유지.
- 웹·앱 데이터 이동은 사용자 파일 가져오기 방식이며 자동 동기화로 안내하지 않음.
- Android/iOS 회귀 테스트, 기존 즐겨찾기·공유·광고 보존 후 별도 앱 릴리스. Google Play 비공개 테스트 버전은 이번 작업에서 변경하지 않음.

## 검증
`npm test`: 입력 검증, 가져오기 충돌, 기간/차량/카테고리/월평균, 수정삭제 재계산, 인원 비교, 공급자 응답 정규화.
`npm run typecheck`: Next route typegen + TypeScript.
`npm run build:cf`: Next 및 Cloudflare OpenNext 번들.
실제 브라우저 모바일 상호작용 검증은 별도로 수행해야 한다. 자동 테스트 픽스처는 운영 데이터가 아니다.
