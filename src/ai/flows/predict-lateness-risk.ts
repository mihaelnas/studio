'use server';

/**
 * @fileOverview Predicts employee lateness risk using AI.
 *
 * - predictLatenessRisk - A function that predicts employee lateness risk.
 * - PredictLatenessRiskInput - The input type for the predictLatenessRisk function.
 * - PredictLatenessRiskOutput - The return type for the predictLatenessRisk function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherForecast } from '@/ai/tools/weather';

const PredictLatenessRiskInputSchema = z.object({
  historicalAttendanceData: z
    .string()
    .describe('Historical attendance data for the employee, in CSV format.'),
});
export type PredictLatenessRiskInput = z.infer<
  typeof PredictLatenessRiskInputSchema
>;

const PredictLatenessRiskOutputSchema = z.object({
  riskLevel: z
    .enum(['Élevé', 'Moyen', 'Faible'])
    .describe('The predicted lateness risk level.'),
  reason: z
    .string()
    .describe('A brief justification for the predicted risk level.'),
});
export type PredictLatenessRiskOutput = z.infer<
  typeof PredictLatenessRiskOutputSchema
>;

export async function predictLatenessRisk(
  input: PredictLatenessRiskInput
): Promise<PredictLatenessRiskOutput> {
  return predictLatenessRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLatenessRiskPrompt',
  input: { schema: PredictLatenessRiskInputSchema },
  output: { schema: PredictLatenessRiskOutputSchema },
  tools: [getWeatherForecast],
  prompt: `You are an HR analyst tasked with predicting employee lateness risk.
  Analyze the following historical attendance data for an employee:
  {{{historicalAttendanceData}}}

  Use the weather forecast tool to check if it will rain tomorrow in Antananarivo.
  Consider past patterns and the weather to predict if the employee is likely to be late.
  For example, if heavy rain is forecasted, the risk of lateness may increase.

  Based on this data, determine a risk level (Élevé, Moyen, Faible) and provide a brief reason for your prediction.
  `,
});

const predictLatenessRiskFlow = ai.defineFlow(
  {
    name: 'predictLatenessRiskFlow',
    inputSchema: PredictLatenessRiskInputSchema,
    outputSchema: PredictLatenessRiskOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
