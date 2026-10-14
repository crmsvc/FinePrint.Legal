import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  SYSTEM_PROMPT,
  ANALYSIS_PREFIX,
  CLAUSE_ANALYSIS_PROMPT,
} from "@/lib/site/prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 16384,
  },
});

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface DataCategory {
  category: string;
  details: string;
  mandatory: boolean;
  riskLevel: RiskLevel;
}

export interface DataPractice {
  practice: string;
  details: string;
  riskLevel: RiskLevel;
}

export interface RightsClause {
  title: string;
  originalText: string;
  translation: string;
  riskLevel: RiskLevel;
}

export interface RedFlag {
  clause: string;
  whyItMatters: string;
  industryComparison: string;
}

export interface ExitInfo {
  canDelete: string;
  dataRetention: string;
  dataPortability: string;
  overallDifficulty: RiskLevel;
}

export interface AnalysisResult {
  mode: "full";
  grade: string;
  verdict: string;
  whatTheyCollect: DataCategory[];
  whatTheyDoWithData: DataPractice[];
  rightsYouGiveUp: RightsClause[];
  howToLeave: ExitInfo;
  redFlags: RedFlag[];
  bottomLine: string;
}

export interface NotTOSResult {
  mode: "not_tos";
  message: string;
}

export type TOSAnalysisResult = AnalysisResult | NotTOSResult;

export async function analyzeTOS(text: string): Promise<TOSAnalysisResult> {
  const result = await model.generateContent(ANALYSIS_PREFIX + text);
  const response = result.response.text();

  // Try to parse as JSON
  try {
    const cleaned = response
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned) as TOSAnalysisResult;
  } catch (parseError) {
    // JSON may have been truncated by token limit — try to salvage
    console.error(
      "JSON parse failed. Response length:",
      response.length,
      "First 200 chars:",
      response.slice(0, 200)
    );

    // Attempt partial JSON recovery: find the last complete field
    const cleaned = response
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Try to extract key fields from truncated JSON
    const gradeMatch = cleaned.match(/"grade"\s*:\s*"([^"]+)"/);
    const verdictMatch = cleaned.match(/"verdict"\s*:\s*"([^"]+)"/);
    const bottomLineMatch = cleaned.match(/"bottomLine"\s*:\s*"([^"]+)"/);

    if (gradeMatch && verdictMatch) {
      // We got at least grade + verdict — return partial result
      return {
        mode: "full",
        grade: gradeMatch[1],
        verdict: verdictMatch[1],
        whatTheyCollect: [],
        whatTheyDoWithData: [],
        rightsYouGiveUp: [],
        howToLeave: {
          canDelete: "",
          dataRetention: "",
          dataPortability: "",
          overallDifficulty: "MEDIUM",
        },
        redFlags: [],
        bottomLine: bottomLineMatch
          ? bottomLineMatch[1]
          : "Analysis was too large to fully process. Try analyzing each document separately for detailed results.",
      };
    }

    // Complete failure — return generic error
    return {
      mode: "full",
      grade: extractGrade(response),
      verdict: "Analysis encountered a processing error.",
      whatTheyCollect: [],
      whatTheyDoWithData: [],
      rightsYouGiveUp: [],
      howToLeave: {
        canDelete: "",
        dataRetention: "",
        dataPortability: "",
        overallDifficulty: "MEDIUM",
      },
      redFlags: [],
      bottomLine:
        "The analysis response was too large to process completely. This can happen with combined TOS and Privacy Policy documents. Try analyzing each document separately for detailed section-by-section results.",
    };
  }
}

function extractGrade(text: string): string {
  const match = text.match(/\b([A-F][+-]?)\b/);
  return match ? match[1] : "N/A";
}

/* ---------- Clause Analysis (Wall of Shame) ---------- */

export interface ClauseAnalysisResult {
  headline: string;
  explanation: string;
  industryContext: string;
  riskLevel: "HIGH" | "MEDIUM";
}

export interface ClauseAnalysisError {
  error: "not_a_clause";
  reason: string;
}

export type ClauseAnalysisResponse =
  | ClauseAnalysisResult
  | ClauseAnalysisError;

const clauseModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: CLAUSE_ANALYSIS_PROMPT,
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
});

export async function analyzeClause(
  clauseText: string,
  companyName: string
): Promise<ClauseAnalysisResponse> {
  const prompt = `Company: ${companyName}\n\nClause text:\n${clauseText}`;
  const result = await clauseModel.generateContent(prompt);
  const response = result.response.text();

  const cleaned = response
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as ClauseAnalysisResponse;
}
