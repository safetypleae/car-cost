"use client";

import { useMemo, useState } from "react";
import type { TripDocumentData } from "@/lib/tripDocuments";

const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const initialDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

function optionalAmount(value: string) {
  if (value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export default function TripDocumentGenerator({
  origin,
  destination,
  tripLabel,
  distanceKm,
  durationMinutes,
  expectedFuelCost,
  expectedTollFee,
  expectedParkingFee,
}: {
  origin: string;
  destination: string;
  tripLabel: string;
  distanceKm: number;
  durationMinutes: number;
  expectedFuelCost: number;
  expectedTollFee: number;
  expectedParkingFee: number;
}) {
  const [open, setOpen] = useState(false);
  const [tripDate, setTripDate] = useState(initialDate);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [actualFuelCost, setActualFuelCost] = useState("");
  const [actualTollFee, setActualTollFee] = useState("");
  const [actualParkingFee, setActualParkingFee] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [status, setStatus] = useState<"idle" | "excel" | "pdf">("idle");
  const [message, setMessage] = useState("");

  const data = useMemo<TripDocumentData>(() => ({
    tripDate,
    name: name.trim(),
    department: department.trim(),
    purpose: purpose.trim(),
    vehicleNumber: vehicleNumber.trim(),
    origin,
    destination,
    tripLabel,
    distanceKm,
    durationMinutes,
    expectedFuelCost,
    expectedTollFee,
    expectedParkingFee,
    actualFuelCost: optionalAmount(actualFuelCost),
    actualTollFee: optionalAmount(actualTollFee),
    actualParkingFee: optionalAmount(actualParkingFee),
    otherCost: optionalAmount(otherCost) ?? 0,
    otherNote: otherNote.trim(),
  }), [tripDate, name, department, purpose, vehicleNumber, origin, destination, tripLabel, distanceKm, durationMinutes, expectedFuelCost, expectedTollFee, expectedParkingFee, actualFuelCost, actualTollFee, actualParkingFee, otherCost, otherNote]);

  const items = [
    { label: "유류비", expected: expectedFuelCost, actual: data.actualFuelCost },
    { label: "통행료", expected: expectedTollFee, actual: data.actualTollFee },
    { label: "주차비", expected: expectedParkingFee, actual: data.actualParkingFee },
    { label: "기타 경비", expected: 0, actual: data.otherCost },
  ];
  const total = items.reduce((sum, item) => sum + (item.actual ?? item.expected), 0);

  const generate = async (format: "excel" | "pdf") => {
    if (!tripDate || !data.name || !data.purpose) {
      setMessage("출장 날짜, 성명, 출장 목적을 입력해주세요.");
      return;
    }
    setStatus(format);
    setMessage("");
    try {
      const generator = await import("@/lib/tripDocuments");
      if (format === "excel") await generator.downloadExcel(data);
      else await generator.downloadPdf(data);
      setMessage(`${format === "excel" ? "Excel" : "PDF"} 파일을 생성했습니다.`);
    } catch (caught) {
      console.error(caught);
      setMessage("파일을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button type="button" className="w-full px-5 py-4 text-left text-sm font-bold text-indigo-700 hover:bg-slate-50" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "▲ 출장 운행일지 · 경비정산서 만들기 닫기" : "▼ 출장 운행일지 · 경비정산서 만들기"}
      </button>
      {open && (
        <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
          <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-950">
            <p className="font-bold">계산 결과 자동 입력</p>
            <p className="mt-1 leading-6">{origin} → {destination} · {tripLabel} · {distanceKm.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}km · 예상 유류비 {won(expectedFuelCost)} · 통행료 {won(expectedTollFee)} · 주차비 {won(expectedParkingFee)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="trip-date" label="출장 날짜 *" type="date" value={tripDate} onChange={setTripDate} />
            <TextField id="traveler-name" label="성명 *" value={name} onChange={setName} placeholder="홍길동" maxLength={40} />
            <TextField id="department" label="소속 (선택)" value={department} onChange={setDepartment} placeholder="영업팀" maxLength={80} />
            <TextField id="vehicle-number" label="차량번호 (선택)" value={vehicleNumber} onChange={setVehicleNumber} placeholder="12가 3456" maxLength={30} />
          </div>
          <div>
            <label htmlFor="trip-purpose" className="mb-2 block text-sm font-semibold">출장 목적 *</label>
            <textarea id="trip-purpose" rows={3} value={purpose} onChange={(event) => setPurpose(event.target.value)} maxLength={120} placeholder="출장 목적을 입력하세요" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">실제 지출금액 (선택)</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">입력하면 해당 항목의 예상금액 대신 실제금액을 정산금액으로 사용합니다. 0원을 입력하면 실제 지출 0원으로 처리합니다.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <MoneyField id="actual-fuel" label="실제 주유비" value={actualFuelCost} onChange={setActualFuelCost} placeholder={String(Math.round(expectedFuelCost))} />
              <MoneyField id="actual-toll" label="실제 통행료" value={actualTollFee} onChange={setActualTollFee} placeholder={String(Math.round(expectedTollFee))} />
              <MoneyField id="actual-parking" label="실제 주차비" value={actualParkingFee} onChange={setActualParkingFee} placeholder={String(Math.round(expectedParkingFee))} />
              <MoneyField id="other-cost" label="기타 경비" value={otherCost} onChange={setOtherCost} placeholder="0" />
            </div>
            <div className="mt-4"><TextField id="other-note" label="기타 경비 적요 (선택)" value={otherNote} onChange={setOtherNote} placeholder="예: 출장지 대중교통비" maxLength={60} /></div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="bg-slate-50 px-4 py-3"><h3 className="text-sm font-bold">정산 미리보기</h3></div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.label} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm">
                  <div><span className="font-medium text-slate-800">{item.label}</span><span className="ml-2 text-xs text-slate-400">예상 {won(item.expected)}</span></div>
                  <div className="text-right"><strong>{won(item.actual ?? item.expected)}</strong><span className="ml-2 text-xs text-slate-500">{item.actual === null ? "예상 사용" : "실제 입력"}</span></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-emerald-50 px-4 py-4"><strong>총 정산금액</strong><strong className="text-xl text-emerald-700">₩{Math.round(total).toLocaleString("ko-KR")}</strong></div>
          </div>

          <p className="text-xs leading-5 text-slate-500">회사별 규정에 따른 실제 지급 확정액이 아닙니다. 증빙 영수증 제출 여부와 비용 인정 범위는 회사 규정을 확인하세요. 입력 내용은 서버에 저장하지 않으며 파일은 현재 브라우저에서 생성됩니다.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={status !== "idle"} onClick={() => void generate("excel")} className="rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{status === "excel" ? "Excel 생성 중..." : "Excel 다운로드"}</button>
            <button type="button" disabled={status !== "idle"} onClick={() => void generate("pdf")} className="rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{status === "pdf" ? "PDF 생성 중..." : "PDF 다운로드"}</button>
          </div>
          {message && <p role="status" className="text-center text-sm font-medium text-slate-600">{message}</p>}
        </div>
      )}
    </div>
  );
}

function TextField({ id, label, value, onChange, placeholder, type = "text", maxLength }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; maxLength?: number }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label><input id={id} type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>;
}

function MoneyField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label><div className="flex items-center rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"><input id={id} type="number" min="0" step="1" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" /><span className="pr-4 text-sm text-slate-400">원</span></div></div>;
}
