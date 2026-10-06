"use client";

import { useMemo, useState } from "react";

const n = (v: string) => {
  const value = Number(v);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};
const won = (v: number) => Math.round(v).toLocaleString("ko-KR");
const num = (v: number, digits = 1) =>
  v.toLocaleString("ko-KR", { maximumFractionDigits: digits });

function Field({
  label,
  value,
  onChange,
  unit,
  step = "1",
  min = "0",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 px-4 py-3 outline-none"
        />
        <span className="flex items-center bg-slate-50 px-4 text-sm font-semibold text-slate-500">
          {unit}
        </span>
      </div>
    </label>
  );
}

function Result({
  rows,
  totalLabel,
  total,
}: {
  rows: Array<[string, string]>;
  totalLabel: string;
  total: string;
}) {
  return (
    <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
      <div className="space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-slate-300">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-slate-700 pt-5">
        <p className="text-sm text-slate-300">{totalLabel}</p>
        <p className="mt-1 text-3xl font-bold">{total}</p>
      </div>
    </div>
  );
}

export function FuelCostCalculator() {
  const [distance, setDistance] = useState("300");
  const [efficiency, setEfficiency] = useState("12");
  const [price, setPrice] = useState("1700");
  const [roundTrip, setRoundTrip] = useState(false);
  const [people, setPeople] = useState("1");

  const r = useMemo(() => {
    const km = n(distance) * (roundTrip ? 2 : 1);
    const liters = n(efficiency) > 0 ? km / n(efficiency) : 0;
    const cost = liters * n(price);
    return {
      km,
      liters,
      cost,
      per: n(people) > 0 ? cost / n(people) : cost,
    };
  }, [distance, efficiency, price, roundTrip, people]);

  return (
    <CalculatorCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="편도 주행거리" value={distance} onChange={setDistance} unit="km" step="0.1" />
        <Field label="차량 연비" value={efficiency} onChange={setEfficiency} unit="km/L" step="0.1" />
        <Field label="유가" value={price} onChange={setPrice} unit="원/L" />
        <Field label="탑승 인원" value={people} onChange={setPeople} unit="명" min="1" />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={roundTrip}
          onChange={(e) => setRoundTrip(e.target.checked)}
          className="h-4 w-4"
        />
        왕복으로 계산
      </label>

      <Result
        rows={[
          ["계산 거리", `${num(r.km)} km`],
          ["예상 사용 연료", `${num(r.liters, 2)} L`],
          ["1인당", `${won(r.per)}원`],
        ]}
        totalLabel="예상 기름값"
        total={`${won(r.cost)}원`}
      />
    </CalculatorCard>
  );
}

export function TripCostCalculator() {
  const [distance, setDistance] = useState("300");
  const [efficiency, setEfficiency] = useState("12");
  const [price, setPrice] = useState("1700");
  const [toll, setToll] = useState("15000");
  const [people, setPeople] = useState("2");

  const r = useMemo(() => {
    const liters = n(efficiency) > 0 ? n(distance) / n(efficiency) : 0;
    const fuel = liters * n(price);
    const total = fuel + n(toll);
    return {
      liters,
      fuel,
      total,
      per: n(people) > 0 ? total / n(people) : total,
    };
  }, [distance, efficiency, price, toll, people]);

  return (
    <CalculatorCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="총 주행거리" value={distance} onChange={setDistance} unit="km" step="0.1" />
        <Field label="차량 연비" value={efficiency} onChange={setEfficiency} unit="km/L" step="0.1" />
        <Field label="유가" value={price} onChange={setPrice} unit="원/L" />
        <Field label="총 통행료" value={toll} onChange={setToll} unit="원" />
        <Field label="탑승 인원" value={people} onChange={setPeople} unit="명" min="1" />
      </div>

      <Result
        rows={[
          ["예상 기름값", `${won(r.fuel)}원`],
          ["통행료", `${won(n(toll))}원`],
          ["1인당", `${won(r.per)}원`],
        ]}
        totalLabel="기름값 + 통행료"
        total={`${won(r.total)}원`}
      />
    </CalculatorCard>
  );
}

export function CommuteCostCalculator() {
  const [dailyKm, setDailyKm] = useState("40");
  const [days, setDays] = useState("22");
  const [efficiency, setEfficiency] = useState("12");
  const [price, setPrice] = useState("1700");
  const [parking, setParking] = useState("0");

  const r = useMemo(() => {
    const monthlyKm = n(dailyKm) * n(days);
    const fuel =
      n(efficiency) > 0 ? (monthlyKm / n(efficiency)) * n(price) : 0;
    const parkingCost = n(parking) * n(days);
    const monthly = fuel + parkingCost;

    return {
      monthlyKm,
      fuel,
      parkingCost,
      monthly,
      annual: monthly * 12,
    };
  }, [dailyKm, days, efficiency, price, parking]);

  return (
    <CalculatorCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="하루 왕복거리" value={dailyKm} onChange={setDailyKm} unit="km" step="0.1" />
        <Field label="월 출근일" value={days} onChange={setDays} unit="일" min="1" />
        <Field label="차량 연비" value={efficiency} onChange={setEfficiency} unit="km/L" step="0.1" />
        <Field label="유가" value={price} onChange={setPrice} unit="원/L" />
        <Field label="하루 주차비" value={parking} onChange={setParking} unit="원" />
      </div>

      <Result
        rows={[
          ["월 주행거리", `${num(r.monthlyKm)} km`],
          ["월 기름값", `${won(r.fuel)}원`],
          ["월 주차비", `${won(r.parkingCost)}원`],
          ["연간 예상비용", `${won(r.annual)}원`],
        ]}
        totalLabel="월 예상 출퇴근 비용"
        total={`${won(r.monthly)}원`}
      />
    </CalculatorCard>
  );
}

type SplitMode = "equal" | "passengers";

export function CarpoolCalculator() {
  const [distance, setDistance] = useState("300");
  const [efficiency, setEfficiency] = useState("12");
  const [price, setPrice] = useState("1700");
  const [toll, setToll] = useState("15000");
  const [parking, setParking] = useState("10000");
  const [extra, setExtra] = useState("0");
  const [people, setPeople] = useState("3");
  const [roundTrip, setRoundTrip] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");

  const r = useMemo(() => {
    const totalPeople = Math.max(1, Math.floor(n(people)));
    const km = n(distance) * (roundTrip ? 2 : 1);
    const liters = n(efficiency) > 0 ? km / n(efficiency) : 0;
    const fuel = liters * n(price);
    const total = fuel + n(toll) + n(parking) + n(extra);

    const equalPerPerson = total / totalPeople;
    const passengerCount = Math.max(0, totalPeople - 1);
    const passengerPerPerson =
      passengerCount > 0 ? total / passengerCount : 0;

    return {
      totalPeople,
      km,
      liters,
      fuel,
      total,
      equalPerPerson,
      passengerCount,
      passengerPerPerson,
    };
  }, [
    distance,
    efficiency,
    price,
    toll,
    parking,
    extra,
    people,
    roundTrip,
  ]);

  const selectedPerPerson =
    splitMode === "equal" ? r.equalPerPerson : r.passengerPerPerson;

  return (
    <CalculatorCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="편도 주행거리"
          value={distance}
          onChange={setDistance}
          unit="km"
          step="0.1"
        />
        <Field
          label="차량 연비"
          value={efficiency}
          onChange={setEfficiency}
          unit="km/L"
          step="0.1"
        />
        <Field label="유가" value={price} onChange={setPrice} unit="원/L" />
        <Field label="통행료" value={toll} onChange={setToll} unit="원" />
        <Field label="주차비" value={parking} onChange={setParking} unit="원" />
        <Field label="기타 비용" value={extra} onChange={setExtra} unit="원" />
        <Field
          label="총 탑승 인원"
          value={people}
          onChange={setPeople}
          unit="명"
          min="1"
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={roundTrip}
          onChange={(e) => setRoundTrip(e.target.checked)}
          className="h-4 w-4"
        />
        왕복으로 계산
      </label>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-slate-700">비용 분담 방식</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSplitMode("equal")}
            className={`rounded-xl border p-4 text-left transition ${
              splitMode === "equal"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <strong className="block text-sm">모두 똑같이 나누기</strong>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              운전자를 포함한 전체 인원이 동일하게 부담
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSplitMode("passengers")}
            className={`rounded-xl border p-4 text-left transition ${
              splitMode === "passengers"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <strong className="block text-sm">운전자는 제외하기</strong>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              운전자 1명은 0원, 나머지 동승자가 비용 부담
            </span>
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">계산 거리</span>
            <strong>{num(r.km)} km</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">예상 사용 연료</span>
            <strong>{num(r.liters, 2)} L</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">예상 기름값</span>
            <strong>{won(r.fuel)}원</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">통행료</span>
            <strong>{won(n(toll))}원</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">주차비</span>
            <strong>{won(n(parking))}원</strong>
          </div>
          {n(extra) > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-300">기타 비용</span>
              <strong>{won(n(extra))}원</strong>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-slate-700 pt-3">
            <span className="text-slate-300">총 이동비</span>
            <strong>{won(r.total)}원</strong>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-700 pt-5">
          {splitMode === "equal" ? (
            <>
              <p className="text-sm text-slate-300">
                {r.totalPeople}명 균등 분담 · 1인당
              </p>
              <p className="mt-1 text-3xl font-bold">
                {won(selectedPerPerson)}원
              </p>
            </>
          ) : r.passengerCount > 0 ? (
            <>
              <p className="text-sm text-slate-300">
                운전자 0원 · 동승자 {r.passengerCount}명 각각
              </p>
              <p className="mt-1 text-3xl font-bold">
                {won(selectedPerPerson)}원
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-amber-300">
                운전자 제외 방식은 최소 2명이 탑승해야 합니다.
              </p>
              <p className="mt-1 text-3xl font-bold">0원</p>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        실제 주행거리와 통행료를 모른다면 차비얼마 메인 계산기에서 먼저
        실제 출발지와 목적지를 검색해 확인할 수 있습니다.
      </p>
    </CalculatorCard>
  );
}

function CalculatorCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      {children}
    </section>
  );
}
