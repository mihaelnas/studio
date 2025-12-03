'use server';

/**
 * @fileOverview Predicts employee lateness using AI to highlight at-risk employees.
 *
 * - predictEmployeeLateness - A function that predicts employee lateness.
 * - PredictEmployeeLatenessInput - The input type for the predictEmployeeLateness function.
 * - PredictEmployeeLatenessOutput - The return type for the predictEmployeeLateness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictEmployeeLatenessInputSchema = z.object({
  employeeId: z.string().describe('The ID of the employee.'),
  historicalAttendanceData: z.string().describe('Historical attendance data for the employee.'),
});
export type PredictEmployeeLatenessInput = z.infer<typeof PredictEmployeeLatenessInputSchema>;

const PredictEmployeeLatenessOutputSchema = z.object({
  isLatenessPredicted: z.boolean().describe('Whether lateness is predicted for the employee.'),
  reason: z.string().describe('The reason for the predicted lateness.'),
  riskLevel: z.enum(['High', 'Medium', 'Low']).describe('The risk level of lateness.'),
});
export type PredictEmployeeLatenessOutput = z.infer<typeof PredictEmployeeLatenessOutputSchema>;

export async function predictEmployeeLateness(input: PredictEmployeeLatenessInput): Promise<PredictEmployeeLatenessOutput> {
  return predictEmployeeLatenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictEmployeeLatenessPrompt',
  input: {schema: PredictEmployeeLatenessInputSchema},
  output: {schema: PredictEmployeeLatenessOutputSchema},
  prompt: `You are an HR analyst who predict employee lateness based on historical attendance data.

  Analyze the following historical attendance data for the employee:
  Employee ID: {{{employeeId}}}
  Historical Attendance Data: {{{historicalAttendanceData}}}

  Based on this data, predict whether the employee is likely to be late.
  Provide a reason for your prediction and a risk level (High, Medium, Low).

  Output in JSON format:
  {
    "isLatenessPredicted": true or false,
    "reason": "reason for the predicted lateness",
    "riskLevel": "High, Medium, or Low"
  }`,
});

const predictEmployeeLatenessFlow = ai.defineFlow(
  {
    name: 'predictEmployeeLatenessFlow',
    inputSchema: PredictEmployeeLatenessInputSchema,
    outputSchema: PredictEmployeeLatenessOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
