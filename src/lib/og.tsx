import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Text-only branded card (Be Vietnam Pro covers Vietnamese diacritics). */
export async function renderOg({
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer: string;
}) {
  const font = await readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-SemiBold.ttf"));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #141210 0%, #1f1b16 60%, #2a2318 100%)",
        color: "#f3efe6",
        fontFamily: "BeVietnamPro",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 6,
          color: "#d9b36a",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ display: "flex", fontSize: 36, color: "#d9b36a" }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#bdb5a6" }}>{footer}</div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "BeVietnamPro", data: font, weight: 600, style: "normal" }] },
  );
}
