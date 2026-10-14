import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/site/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: submission } = await supabaseAdmin
    .from("submissions")
    .select("company_name, clause_text, categories(name)")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  const companyName = submission?.company_name || "Unknown Company";
  const clausePreview =
    submission?.clause_text?.slice(0, 120) + (submission?.clause_text && submission.clause_text.length > 120 ? "..." : "") ||
    "Outrageous TOS clause";
  const rawCat = submission?.categories;
  const normalizedCat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
  const categoryName = (normalizedCat as { name: string } | null)?.name || "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#18181b",
          padding: "48px",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#ef4444",
              fontSize: "24px",
            }}
          >
            🚩
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "12px",
                color: "#ef4444",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Wall of Shame
            </span>
            {categoryName && (
              <span style={{ fontSize: "14px", color: "#a1a1aa" }}>
                {categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Company name */}
        <span
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "white",
            marginBottom: "16px",
          }}
        >
          {companyName}
        </span>

        {/* Clause preview */}
        <div
          style={{
            display: "flex",
            flex: 1,
            borderLeft: "4px solid #ef4444",
            paddingLeft: "16px",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            &ldquo;{clausePreview}&rdquo;
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: "16px",
            marginTop: "16px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#52525b" }}>
            FinePrint | We read the fine print
          </span>
          <span style={{ fontSize: "14px", color: "#52525b" }}>
            Wall of Shame — FinePrint
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
