import { suggestedPlaces } from "@/data/regions";

/**
 * Native GET form: no client-side API calls, no location lookup until the user
 * opens the calculator and chooses an actual place from the results.
 */
export default function RoutePairSearch() {
  return (
    <section
      aria-labelledby="route-search-title"
      className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
    >
      <p className="text-sm font-bold text-blue-600">전국 지역 간 이동비</p>
      <h2 id="route-search-title" className="mt-1 text-xl font-bold">
        어디서 어디까지 차로 가시나요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        전국 시·군·구, 공항, 관광지 등 원하는 지역을 직접 입력하세요.
        아래 추천 목록에 없는 지역도 검색할 수 있습니다.
        정확한 출발·도착 장소는 계산기에서 선택해 주세요.
      </p>
      <form action="/" method="get" className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="route-from" className="mb-2 block text-sm font-semibold">
            출발 지역
          </label>
          <input
            id="route-from"
            name="from"
            list="nationwide-route-places"
            type="text"
            placeholder="예: 춘천, 강남구"
            autoComplete="off"
            minLength={2}
            maxLength={60}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="route-to" className="mb-2 block text-sm font-semibold">
            도착 지역
          </label>
          <input
            id="route-to"
            name="to"
            list="nationwide-route-places"
            type="text"
            placeholder="예: 성남, 부산"
            autoComplete="off"
            minLength={2}
            maxLength={60}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          차비 계산하기
        </button>
        <datalist id="nationwide-route-places">
          {suggestedPlaces.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        이 입력만으로는 거리·통행료를 조회하지 않습니다. 계산기에서 실제 장소를
        선택하고 계산 버튼을 눌렀을 때 필요한 정보를 조회합니다.
      </p>
    </section>
  );
}
