export interface AnalysisResult {
  success: boolean;
  data?: {
    summary: string;
    deadline?: {
      days: number;
      type: "úteis" | "corridos";
      startDate: string;
      endDate: string;
    };
    suggestedActions: string[];
    priority: "low" | "medium" | "high" | "urgent";
    documentType: string;
    parties?: {
      author?: string;
      defendant?: string;
    };
    nextSteps: string[];
  };
  message?: string;
  error?: string;
}

// Helper to parse AI's response into a structured AnalysisResult.data
export function parseAIResponse(aiResponse: string, documentType: string) {
  try {
    const cleanJson = aiResponse
      .replaceAll(/```json\n?/g, "")
      .replaceAll(/```\n?/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch {
    return {
      summary: aiResponse.substring(0, 500),
      suggestedActions: ["Revisar intimação manualmente"],
      priority: "medium",
      documentType: documentType,
      nextSteps: ["Análise manual requerida"],
    } as unknown as AnalysisResult["data"];
  }
}

// Helper to compute and assign startDate/endDate from a 'deadline' object
export function applyDeadlineDates(analysisData: AnalysisResult["data"] | null | undefined) {
  if (!analysisData?.deadline?.days) return;

  const startDate = new Date();
  const endDate = new Date(startDate);

  if (analysisData.deadline.type === "úteis") {
    // Add business days (simple approach - doesn't consider holidays)
    let daysAdded = 0;
    while (daysAdded < analysisData.deadline.days) {
      endDate.setDate(endDate.getDate() + 1);
      const dayOfWeek = endDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
  } else {
    endDate.setDate(endDate.getDate() + analysisData.deadline.days);
  }

  analysisData.deadline.startDate = startDate.toISOString().split("T")[0];
  analysisData.deadline.endDate = endDate.toISOString().split("T")[0];
}
