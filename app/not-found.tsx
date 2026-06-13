import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #FBF8F3)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        {/* Ring emoji */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "rgba(201,110,44,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 24px",
          }}
        >
          💍
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#C96E2C",
            lineHeight: 1,
            letterSpacing: -4,
            marginBottom: 8,
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1C1C1E",
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          Page introuvable
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6B6B6B",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard"
            style={{
              padding: "12px 24px",
              background: "#C96E2C",
              color: "white",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Tableau de bord
          </Link>
          <Link
            href="/"
            style={{
              padding: "12px 24px",
              background: "white",
              color: "#1C1C1E",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              border: "1.5px solid #E8E0D8",
              display: "inline-block",
            }}
          >
            Accueil
          </Link>
        </div>

        <p
          style={{
            marginTop: 40,
            fontSize: 12,
            color: "#B0A090",
          }}
        >
          Jour J — Organisation de mariage
        </p>
      </div>
    </div>
  );
}
