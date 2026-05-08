import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dinemate — A meal planner for UNC Chapel Hill";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#f8f5ee",
          color: "#14213d",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #14213d",
            paddingBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 40, fontWeight: 500, fontStyle: "italic" }}>
              Dinemate
            </span>
            <span
              style={{
                fontSize: 14,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(20,33,61,0.55)",
              }}
            >
              Sid Subramanian · powered by Next.js
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(20,33,61,0.55)",
            }}
          >
            Spring 2026
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              fontSize: 130,
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            The plate,
          </div>
          <div
            style={{
              fontSize: 130,
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            programmed.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            paddingTop: 32,
            borderTop: "1px solid rgba(20,33,61,0.2)",
          }}
        >
          <span style={{ fontSize: 22, color: "rgba(20,33,61,0.85)", maxWidth: 720 }}>
            An honest meal planner for UNC Chapel Hill — built from real
            Carolina Dining Services menus.
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(20,33,61,0.55)",
            }}
          >
            Hit your macros
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
