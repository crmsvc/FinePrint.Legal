import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/site/supabase";

async function resolveCompanyForOG(slug: string) {
  try {
    const { data } = await supabaseAdmin
      .from("companies")
      .select("name, overall_grade, verdict")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (data)
      return {
        name: data.name,
        grade: data.overall_grade,
        verdict: data.verdict,
      };
  } catch {
    // fall through
  }

  return null;
}

const gradeColors: Record<string, string> = {
  "A+": "#10b981",
  A: "#10b981",
  "A-": "#10b981",
  "B+": "#14b8a6",
  B: "#14b8a6",
  "B-": "#14b8a6",
  "C+": "#f59e0b",
  C: "#f59e0b",
  "C-": "#f59e0b",
  "D+": "#f97316",
  D: "#f97316",
  "D-": "#f97316",
  F: "#ef4444",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Hall of Fame generic card
  if (slug === "hall-of-fame") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#18181b",
            padding: "60px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#14b8a6",
              }}
            >
              🏆 Hall of Fame
            </span>
            <span
              style={{
                fontSize: "24px",
                color: "#a1a1aa",
                lineHeight: 1.5,
                maxWidth: "800px",
              }}
            >
              Companies that respect your privacy and rights. Graded B- or
              higher by FinePrint.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #27272a",
              paddingTop: "20px",
              marginTop: "40px",
            }}
          >
            <span style={{ fontSize: "16px", color: "#52525b" }}>
              FinePrint | We read the fine print
            </span>
            <span style={{ fontSize: "16px", color: "#52525b" }}>
              Hall of Fame — FinePrint
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { "Cache-Control": "public, max-age=86400" },
      }
    );
  }

  // Company-specific card (local JSON + Supabase)
  const company = await resolveCompanyForOG(slug);

  // Also handle /api/og/default for the global fallback
  if (slug === "default" || !company) {
    // Generic FinePrint card
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#18181b",
            padding: "60px",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            FinePrint
          </span>
          <span
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              marginTop: "16px",
            }}
          >
            We read the fine print so you don&apos;t have to.
          </span>
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #27272a",
              paddingTop: "20px",
              marginTop: "40px",
            }}
          >
            <span style={{ fontSize: "16px", color: "#52525b" }}>
              FinePrint | We read the fine print
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { "Cache-Control": "public, max-age=86400" },
      }
    );
  }

  const gradeColor = gradeColors[company.grade] || "#f59e0b";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#18181b",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            flex: 1,
          }}
        >
          {/* Grade badge */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "20px",
              backgroundColor: gradeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: "56px", fontWeight: 700, color: "white" }}
            >
              {company.grade}
            </span>
          </div>

          {/* Company name + verdict */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: "12px",
            }}
          >
            <span
              style={{ fontSize: "40px", fontWeight: 700, color: "white" }}
            >
              {company.name}
            </span>
            <span
              style={{
                fontSize: "22px",
                color: "#a1a1aa",
                lineHeight: 1.5,
                maxWidth: "750px",
              }}
            >
              {company.verdict}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: "20px",
            marginTop: "20px",
          }}
        >
          <span style={{ fontSize: "16px", color: "#52525b" }}>
            FinePrint | We read the fine print
          </span>
          <span style={{ fontSize: "16px", color: "#52525b" }}>
            Analyzed by FinePrint
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400" },
    }
  );
}
