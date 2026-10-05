"use client";

import { useMemo, useState } from "react";

type TripType = "oneway" | "roundtrip";

const formatWon = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));

export default function Home() {
  const [distance, setDistance] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [toll, setToll] = useState("0");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<TripType>("oneway");
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    const distanceKm = Number(distance);
    const fuelEfficiency = Number(efficiency);
    const pricePerLiter = Number(fuelPrice);
    const tollFee = Number(toll) || 0;

    if (
      distanceKm <= 0 ||
      fuelEfficiency <= 0 ||
      pricePerLiter <= 0 ||
      passengers <= 0
    ) {
      return null;
    }

    const multiplier = tripType === "roundtrip" ? 2 : 1;

    const totalDistance = distanceKm * multiplier;
    const fuelUsed = totalDistance / fuelEfficiency;
    const fuelCost = fuelUsed * pricePerLiter;
    const totalToll = tollFee * multiplier;
    const totalCost = fuelCost + totalToll;
    const costPerPerson = totalCost / passengers;

    return {
      totalDistance,
      fuelUsed,
      fuelCost,
      totalToll,
      totalCost,
      costPerPerson,
    };
  }, [distance, efficiency, fuelPrice, toll, passengers, tripType]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">
            자동차 이동비 계산기
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            차로 가면
            <br />
            얼마 들까요?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            거리와 차량 정보를 입력하면 예상 연료비와 통행료,
            1인당 비용까지 한 번에 계산합니다.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setTripType("oneway");
                setCalculated(false);
              }}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                tripType === "oneway"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              편도
            </button>

            <button
              type="button"
              onClick={() => {
                setTripType("roundtrip");
                setCalculated(false);
              }}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                tripType === "roundtrip"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              왕복
            </button>
          </div>

          <div className="space-y-5">
            <InputField
              label="편도 거리"
              value={distance}
              onChange={(value) => {
                setDistance(value);
                setCalculated(false);
              }}
              placeholder="예: 118"
              unit="km"
            />

            <InputField
              label="차량 연비"
              value={efficiency}
              onChange={(value) => {
                setEfficiency(value);
                setCalculated(false);
              }}
              placeholder="예: 12"
              unit="km/L"
            />

            <InputField
              label="현재 유가"
              value={fuelPrice}
              onChange={(value) => {
                setFuelPrice(value);
                setCalculated(false);
              }}
              placeholder="예: 1680"
              unit="원/L"
            />

            <InputField
              label="편도 통행료"
              value={toll}
              onChange={(value) => {
                setToll(value);
                setCalculated(false);
              }}
              placeholder="예: 6500"
              unit="원"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold">
                탑승 인원
              </label>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setPassengers((prev) => Math.max(1, prev - 1));
                    setCalculated(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium"
                  aria-label="탑승 인원 감소"
                >
                  −
                </button>

                <strong className="text-lg">{passengers}명</strong>

                <button
                  type="button"
                  onClick={() => {
                    setPassengers((prev) => prev + 1);
                    setCalculated(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium"
                  aria-label="탑승 인원 증가"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.99]"
            >
              이동비 계산하기
            </button>
          </div>
        </section>

        {calculated && (
          <section className="mt-6">
            {result ? (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="bg-slate-900 p-6 text-white">
                  <p className="text-sm text-slate-300">
                    {tripType === "roundtrip" ? "왕복" : "편도"} 총 예상 이동비
                  </p>

                  <p className="mt-2 text-4xl font-bold">
                    ₩{formatWon(result.totalCost)}
                  </p>

                  <div className="mt-5 rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-300">
                      {passengers}명 탑승 시 1인당
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      ₩{formatWon(result.costPerPerson)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <ResultRow
                    label="총 이동거리"
                    value={`${result.totalDistance.toLocaleString("ko-KR")} km`}
                  />

                  <ResultRow
                    label="예상 연료 사용량"
                    value={`${result.fuelUsed.toFixed(2)} L`}
                  />

                  <ResultRow
                    label="예상 연료비"
                    value={`₩${formatWon(result.fuelCost)}`}
                  />

                  <ResultRow
                    label="통행료"
                    value={`₩${formatWon(result.totalToll)}`}
                  />

                  <div className="border-t border-slate-200 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      계산식
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {formatWon(result.totalDistance)}km ÷ {efficiency}km/L
                      {" = "}
                      {result.fuelUsed.toFixed(2)}L
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {result.fuelUsed.toFixed(2)}L ×{" "}
                      {Number(fuelPrice).toLocaleString("ko-KR")}원
                      {" = 약 "}
                      {formatWon(result.fuelCost)}원
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                거리, 연비, 유가를 0보다 큰 숫자로 입력해주세요.
              </div>
            )}
          </section>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          현재 버전은 입력값을 기준으로 계산한 예상 비용입니다.
          <br />
          실제 비용은 주행 환경에 따라 달라질 수 있습니다.
        </p>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 outline-none"
        />

        <span className="pr-4 text-sm font-medium text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
