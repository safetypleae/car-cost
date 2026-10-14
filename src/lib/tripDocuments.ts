import type { Worksheet } from "exceljs";

export type TripDocumentData = {
  tripDate: string;
  name: string;
  department: string;
  purpose: string;
  vehicleNumber: string;
  origin: string;
  destination: string;
  tripLabel: string;
  distanceKm: number;
  durationMinutes: number;
  expectedFuelCost: number;
  expectedTollFee: number;
  expectedParkingFee: number;
  actualFuelCost: number | null;
  actualTollFee: number | null;
  actualParkingFee: number | null;
  otherCost: number;
  otherNote: string;
};

type SettlementRow = {
  label: string;
  expected: number;
  actual: number | null;
  settlement: number;
  basis: "실제 입력" | "예상금액 사용" | "직접 입력";
  note: string;
};

function settlementRows(data: TripDocumentData): SettlementRow[] {
  const row = (label: string, expected: number, actual: number | null): SettlementRow => ({
    label,
    expected,
    actual,
    settlement: actual ?? expected,
    basis: actual === null ? "예상금액 사용" : "실제 입력",
    note: "",
  });
  return [
    row("유류비", data.expectedFuelCost, data.actualFuelCost),
    row("통행료", data.expectedTollFee, data.actualTollFee),
    row("주차비", data.expectedParkingFee, data.actualParkingFee),
    {
      label: "기타 경비",
      expected: 0,
      actual: data.otherCost,
      settlement: data.otherCost,
      basis: "직접 입력",
      note: data.otherNote,
    },
  ];
}

function fileBase(data: TripDocumentData) {
  const safeName = (data.name || "출장자").replace(/[\\/:*?"<>|]/g, "_");
  return `출장_운행일지_경비정산서_${data.tripDate || "날짜미정"}_${safeName}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadExcel(data: TripDocumentData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "차비얼마";
  workbook.created = new Date();
  const log = workbook.addWorksheet("출장 운행일지", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  const expense = workbook.addWorksheet("출장 경비정산서", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  const border = { top: { style: "thin" as const }, left: { style: "thin" as const }, bottom: { style: "thin" as const }, right: { style: "thin" as const } };
  const title = (sheet: Worksheet, text: string) => {
    sheet.mergeCells("A1:D2");
    const cell = sheet.getCell("A1");
    cell.value = text;
    cell.font = { name: "맑은 고딕", size: 18, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;
  };
  const addInfoRow = (sheet: Worksheet, rowNumber: number, leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
    const values = [leftLabel, leftValue, rightLabel, rightValue];
    values.forEach((value, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      cell.value = value;
      cell.border = border;
      cell.alignment = { vertical: "middle", wrapText: true };
      if (index % 2 === 0) {
        cell.font = { name: "맑은 고딕", bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      } else {
        cell.font = { name: "맑은 고딕" };
      }
    });
  };

  [log, expense].forEach((sheet) => {
    sheet.columns = [{ width: 16 }, { width: 31 }, { width: 16 }, { width: 31 }];
    sheet.pageSetup.margins = { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    sheet.properties.defaultRowHeight = 22;
  });

  title(log, "출장 운행일지");
  addInfoRow(log, 4, "출장 날짜", data.tripDate, "운행 구분", data.tripLabel);
  addInfoRow(log, 5, "성명", data.name, "소속", data.department || "-");
  addInfoRow(log, 6, "차량번호", data.vehicleNumber || "-", "운행거리", `${data.distanceKm.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} km`);
  addInfoRow(log, 7, "출발지", data.origin, "목적지", data.destination);
  addInfoRow(log, 8, "예상 소요시간", `${Math.round(data.durationMinutes)}분`, "출장 목적", data.purpose);
  log.getRow(8).height = 48;
  log.mergeCells("A10:D10");
  log.getCell("A10").value = "본 문서는 입력한 경로와 예상 비용을 바탕으로 작성한 기본 운행일지입니다.";
  log.getCell("A10").font = { name: "맑은 고딕", size: 10, color: { argb: "FF64748B" } };
  log.getCell("A10").alignment = { wrapText: true };
  log.headerFooter.oddFooter = "차비얼마(car-cost.kr)에서 생성";

  title(expense, "출장 경비정산서");
  addInfoRow(expense, 4, "출장 날짜", data.tripDate, "성명", data.name);
  addInfoRow(expense, 5, "출장 구간", `${data.origin} → ${data.destination}`, "소속", data.department || "-");
  const headers = ["항목", "예상금액", "실제 입력금액", "정산금액", "적용 기준", "적요"];
  headers.forEach((value, index) => {
    const cell = expense.getCell(7, index + 1);
    cell.value = value;
    cell.font = { name: "맑은 고딕", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border;
  });
  expense.columns = [{ width: 15 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 27 }];
  const rows = settlementRows(data);
  rows.forEach((item, index) => {
    const rowNumber = 8 + index;
    const values = [item.label, item.expected, item.actual, item.settlement, item.basis, item.note];
    values.forEach((value, columnIndex) => {
      const cell = expense.getCell(rowNumber, columnIndex + 1);
      cell.value = value;
      cell.font = { name: "맑은 고딕" };
      cell.border = border;
      cell.alignment = { vertical: "middle", wrapText: true, horizontal: columnIndex >= 1 && columnIndex <= 3 ? "right" : "left" };
      if (columnIndex >= 1 && columnIndex <= 3) cell.numFmt = '₩#,##0;[Red]-₩#,##0';
    });
  });
  const totalRow = 12;
  expense.mergeCells(`A${totalRow}:C${totalRow}`);
  expense.getCell(`A${totalRow}`).value = "총 정산금액";
  expense.getCell(`D${totalRow}`).value = rows.reduce((sum, item) => sum + item.settlement, 0);
  expense.getCell(`D${totalRow}`).numFmt = '₩#,##0;[Red]-₩#,##0';
  for (let column = 1; column <= 6; column += 1) {
    const cell = expense.getCell(totalRow, column);
    cell.border = border;
    cell.font = { name: "맑은 고딕", bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  }
  expense.mergeCells("A14:F15");
  expense.getCell("A14").value = "실제 지출금액을 입력한 항목은 실제 금액을, 미입력 항목은 예상금액을 정산금액으로 사용했습니다. 회사별 규정에 따른 지급 확정액이 아니며 증빙 영수증 제출 여부는 회사 규정을 확인하세요.";
  expense.getCell("A14").font = { name: "맑은 고딕", size: 10, color: { argb: "FF64748B" } };
  expense.getCell("A14").alignment = { wrapText: true, vertical: "top" };
  expense.headerFooter.oddFooter = "차비얼마(car-cost.kr)에서 생성";

  const buffer = await workbook.xlsx.writeBuffer();
  download(new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileBase(data)}.xlsx`);
}

export async function downloadPdf(data: TripDocumentData) {
  const { PDFDocument } = await import("pdf-lib");
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF 그리기 환경을 사용할 수 없습니다.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.textBaseline = "middle";
  context.font = '400 26px "Noto Sans KR", "Malgun Gothic", sans-serif';
  const margin = 90;
  const contentWidth = width - margin * 2;
  const rows = settlementRows(data);
  const total = rows.reduce((sum, row) => sum + row.settlement, 0);

  const text = (value: string, x: number, y: number, options?: { size?: number; bold?: boolean; color?: string; align?: CanvasTextAlign }) => {
    context.font = `${options?.bold ? 700 : 400} ${options?.size ?? 26}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
    context.fillStyle = options?.color ?? "#0f172a";
    context.textAlign = options?.align ?? "left";
    context.fillText(value, x, y);
  };
  const fittedText = (value: string, x: number, y: number, maxWidth: number, options?: { size?: number; bold?: boolean; color?: string; align?: CanvasTextAlign }) => {
    let size = options?.size ?? 22;
    do {
      context.font = `${options?.bold ? 700 : 400} ${size}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
      if (context.measureText(value).width <= maxWidth) break;
      size -= 1;
    } while (size > 13);
    text(value, x, y, { ...options, size });
  };
  const line = (x1: number, y1: number, x2: number, y2: number, color = "#cbd5e1") => {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  };
  const wrapped = (value: string, x: number, y: number, maxWidth: number, lineHeight: number, options?: { size?: number; color?: string }) => {
    context.font = `400 ${options?.size ?? 23}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
    context.fillStyle = options?.color ?? "#334155";
    context.textAlign = "left";
    let current = "";
    let offset = 0;
    for (const character of value) {
      if (context.measureText(current + character).width > maxWidth && current) {
        context.fillText(current, x, y + offset);
        current = character;
        offset += lineHeight;
      } else current += character;
    }
    if (current) context.fillText(current, x, y + offset);
    return offset + lineHeight;
  };
  const infoRow = (y: number, label1: string, value1: string, label2: string, value2: string) => {
    const widths = [150, 380, 150, 380];
    let x = margin;
    [label1, value1, label2, value2].forEach((value, index) => {
      context.fillStyle = index % 2 === 0 ? "#e2e8f0" : "#ffffff";
      context.fillRect(x, y, widths[index], 60);
      context.strokeStyle = "#cbd5e1";
      context.strokeRect(x, y, widths[index], 60);
      fittedText(value, x + 14, y + 30, widths[index] - 28, { size: 22, bold: index % 2 === 0 });
      x += widths[index];
    });
  };

  text("출장 운행일지 · 경비정산서", width / 2, 95, { size: 42, bold: true, align: "center" });
  text("차비얼마 car-cost.kr", width / 2, 145, { size: 20, color: "#64748b", align: "center" });
  text("출장 운행일지", margin, 215, { size: 30, bold: true });
  infoRow(250, "출장 날짜", data.tripDate, "운행 구분", data.tripLabel);
  infoRow(310, "성명", data.name, "소속", data.department || "-");
  infoRow(370, "차량번호", data.vehicleNumber || "-", "운행거리", `${data.distanceKm.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} km`);
  infoRow(430, "출발지", data.origin, "목적지", data.destination);
  text("출장 목적", margin, 525, { size: 22, bold: true });
  wrapped(data.purpose, margin + 150, 525, contentWidth - 150, 32, { size: 22 });

  text("출장 경비정산서", margin, 625, { size: 30, bold: true });
  const columns = [180, 220, 220, 220, 220];
  const headers = ["항목", "예상금액", "실제 입력", "정산금액", "적용 기준"];
  let x = margin;
  context.fillStyle = "#334155";
  context.fillRect(margin, 665, contentWidth, 60);
  headers.forEach((header, index) => {
    text(header, x + columns[index] / 2, 695, { size: 21, bold: true, color: "#ffffff", align: "center" });
    x += columns[index];
  });
  rows.forEach((row, rowIndex) => {
    const y = 725 + rowIndex * 65;
    x = margin;
    const values = [
      row.label,
      `${Math.round(row.expected).toLocaleString("ko-KR")}원`,
      row.actual === null ? "미입력" : `${Math.round(row.actual).toLocaleString("ko-KR")}원`,
      `${Math.round(row.settlement).toLocaleString("ko-KR")}원`,
      row.basis,
    ];
    values.forEach((value, columnIndex) => {
      context.strokeStyle = "#cbd5e1";
      context.strokeRect(x, y, columns[columnIndex], 65);
      fittedText(value, x + columns[columnIndex] / 2, y + 32, columns[columnIndex] - 16, { size: 20, bold: columnIndex === 3, align: "center" });
      x += columns[columnIndex];
    });
  });
  const totalY = 725 + rows.length * 65;
  context.fillStyle = "#dcfce7";
  context.fillRect(margin, totalY, contentWidth, 70);
  context.strokeStyle = "#86efac";
  context.strokeRect(margin, totalY, contentWidth, 70);
  text("총 정산금액", margin + 20, totalY + 35, { size: 26, bold: true });
  text(`${Math.round(total).toLocaleString("ko-KR")}원`, width - margin - 20, totalY + 35, { size: 30, bold: true, color: "#047857", align: "right" });

  const otherNoteY = totalY + 110;
  text("기타 경비 적요", margin, otherNoteY, { size: 22, bold: true });
  wrapped(data.otherNote || "-", margin + 180, otherNoteY, contentWidth - 180, 30, { size: 20 });
  const noteY = totalY + 190;
  text("정산 기준 안내", margin, noteY, { size: 25, bold: true });
  wrapped("실제 지출금액을 입력한 항목은 실제 금액을, 미입력 항목은 예상금액을 정산금액으로 사용했습니다. 예상금액과 실제금액은 이중 합산하지 않습니다.", margin, noteY + 48, contentWidth, 34, { size: 22 });
  wrapped("본 문서는 회사별 규정에 따른 실제 지급 확정액이 아닙니다. 증빙 영수증 제출 여부와 인정 범위는 회사 규정을 확인하세요.", margin, noteY + 125, contentWidth, 34, { size: 22, color: "#64748b" });
  line(margin, height - 110, width - margin, height - 110);
  text(`생성일시 ${new Date().toLocaleString("ko-KR")}`, margin, height - 75, { size: 18, color: "#94a3b8" });

  const png = canvas.toDataURL("image/png");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const image = await pdf.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
  const bytes = await pdf.save();
  download(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${fileBase(data)}.pdf`);
}
