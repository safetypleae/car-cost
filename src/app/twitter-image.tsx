import { ImageResponse } from "next/og";

export const alt = "차비얼마 자동차 이동비 계산기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        padding: "72px 84px",
      }}
    >
      <div style={{ display: "flex", color: "#60a5fa", fontSize: 30, fontWeight: 700 }}>
        자동차 이동비 계산기
      </div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 86, fontWeight: 800 }}>
        차비얼마
      </div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: "#cbd5e1" }}>
        거리 · 기름값 · 통행료 · 인원별 차비를 한 번에
      </div>
    </div>,
    size,
  );
}
