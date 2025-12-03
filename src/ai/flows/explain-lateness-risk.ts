'use server';

/**
 * @fileOverview Explains the risk of lateness for an employee based on historical data.
 *
 * - explainLatenessRisk - A function that explains the lateness risk of an employee.
 * - ExplainLatenessRiskInput - The input type for the explainLatenessRisk function.
 * - ExplainLatenessRiskOutput - The return type for the explainLatenessRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainLatenessRiskInputSchema = z.object({
  employeeId: z.string().describe('The ID of the employee.'),
});
export type ExplainLatenessRiskInput = z.infer<typeof ExplainLatenessRiskInputSchema>;

const ExplainLatenessRiskOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of why the employee is flagged for lateness risk.'),
});
export type ExplainLatenessRiskOutput = z.infer<typeof ExplainLatenessRiskOutputSchema>;

export async function explainLatenessRisk(input: ExplainLatenessRiskInput): Promise<ExplainLatenessRiskOutput> {
  return explainLatenessRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainLatenessRiskPrompt',
  input: {schema: ExplainLatenessRiskInputSchema},
  output: {schema: ExplainLatenessRiskOutputSchema},
  prompt: `You are an HR analyst. Given the employee ID: {{{employeeId}}}, analyze historical attendance data and provide a brief explanation of why this employee is flagged for lateness risk. Focus on patterns like frequent lateness on specific days or after certain events.`,
});

const explainLatenessRiskFlow = ai.defineFlow(
  {
    name: 'explainLatenessRiskFlow',
    inputSchema: ExplainLatenessRiskInputSchema,
    outputSchema: ExplainLatenessRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
