import { ImageResponse } from "next/og";

const width = 1200;
const height = 630;

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        background:
          "linear-gradient(135deg, #f7f4ef 0%, #fef3c7 38%, #dbeafe 100%)",
        color: "#0f172a",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "940px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#334155",
          }}
        >
          My Net Worth
        </div>
        <div
          style={{
            fontSize: 72,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            fontWeight: 700,
          }}
        >
          One page. Single table.
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.2,
            color: "#1e293b",
          }}
        >
          Stocks, crypto, 401(k), mortgage, credit card debt, and more.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 22px",
            borderRadius: 9999,
            background: "rgba(15, 23, 42, 0.9)",
            color: "#f8fafc",
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          Safe by design: no account connections, no fund access.
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#1d4ed8",
          }}
        >
          mynetworth
        </div>
      </div>
    </div>,
    {
      width,
      height,
    },
  );
}
