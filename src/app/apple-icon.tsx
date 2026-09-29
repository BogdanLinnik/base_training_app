import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same dumbbell as icon.svg, scaled from its 64px grid to 180px.
const k = 180 / 64;
const bar = (x: number, y: number, w: number, h: number, r: number) => (
  <div
    style={{
      position: "absolute",
      left: x * k,
      top: y * k,
      width: w * k,
      height: h * k,
      borderRadius: r * k,
      background: "#fff",
    }}
  />
);

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#2563eb" }}>
        {bar(24, 29, 16, 6, 1)}
        {bar(16, 20, 8, 24, 2.5)}
        {bar(40, 20, 8, 24, 2.5)}
        {bar(9, 25, 7, 14, 2)}
        {bar(48, 25, 7, 14, 2)}
      </div>
    ),
    size
  );
}
