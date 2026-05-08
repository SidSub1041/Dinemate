import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#14213d",
          color: "#f8f5ee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: "-0.05em",
        }}
      >
        dm
      </div>
    ),
    { ...size }
  );
}
