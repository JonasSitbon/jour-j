import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Jour J — Tableau de bord mariage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FBF8F3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: "#C96E2C", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 28 }}>💍</span>
          </div>
          <span style={{ fontSize: 42, fontWeight: 700, color: "#1C1C1E", letterSpacing: -1 }}>
            Jour J
          </span>
        </div>
        <p style={{ fontSize: 22, color: "#6B6B6B", textAlign: "center", maxWidth: 700, lineHeight: 1.4 }}>
          Organisez votre mariage sereinement.
          Invités · Budget · Prestataires · Jour J
        </p>
        <div style={{
          marginTop: 32,
          padding: "12px 28px",
          background: "#C96E2C",
          borderRadius: 100,
          color: "white",
          fontSize: 18,
          fontWeight: 600,
        }}>
          the-cockpit.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
