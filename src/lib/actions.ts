"use server";

import { explainLatenessRisk } from "@/ai/flows/explain-lateness-risk";

export async function getLatenessExplanation(employeeId: string): Promise<string> {
  try {
    const result = await explainLatenessRisk({ employeeId });
    return result.explanation;
  } catch (error) {
    console.error("Error fetching lateness explanation:", error);
    return "An error occurred while generating the explanation.";
  }
}
