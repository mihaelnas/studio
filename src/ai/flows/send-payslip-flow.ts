'use server';

/**
 * @fileOverview Generates a payslip email content for an employee.
 *
 * - generatePayslipEmail - A function that creates the email body for a payslip.
 * - GeneratePayslipEmailInput - The input type for the function.
 * - GeneratePayslipEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GeneratePayslipEmailInputSchema = z.object({
  employeeName: z.string().describe("The name of the employee."),
  grossSalary: z.number().describe("The employee's gross salary for the period."),
  deductions: z.number().describe("Total deductions."),
  netSalary: z.number().describe("The employee's final net salary."),
  payPeriod: z.string().describe("The pay period (e.g., 'December 2023')."),
});
export type GeneratePayslipEmailInput = z.infer<typeof GeneratePayslipEmailInputSchema>;

export const GeneratePayslipEmailOutputSchema = z.object({
  subject: z.string().describe("The subject of the email."),
  body: z.string().describe("The full HTML body of the email."),
});
export type GeneratePayslipEmailOutput = z.infer<typeof GeneratePayslipEmailOutputSchema>;

export async function generatePayslipEmail(input: GeneratePayslipEmailInput): Promise<GeneratePayslipEmailOutput> {
  return sendPayslipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePayslipEmailPrompt',
  input: { schema: GeneratePayslipEmailInputSchema },
  output: { schema: GeneratePayslipEmailOutputSchema },
  prompt: `You are an HR assistant. Generate a professional and clear payslip email in French.
  The email should be in HTML format, well-structured, and easy to read.

  Use the following information:
  - Employee Name: {{{employeeName}}}
  - Pay Period: {{{payPeriod}}}
  - Gross Salary: {{{grossSalary}}} Ar
  - Deductions: {{{deductions}}} Ar
  - Net Salary: {{{netSalary}}} Ar

  The subject line should be "Votre Fiche de Paie pour {{{payPeriod}}}".
  The body should be a friendly HTML email containing a table with the payslip details.
  The table should clearly show Gross Salary, Deductions, and Net Salary.
  Add a concluding sentence, for example: "N'hésitez pas à nous contacter si vous avez des questions."
  `,
});

const sendPayslipFlow = ai.defineFlow(
  {
    name: 'sendPayslipFlow',
    inputSchema: GeneratePayslipEmailInputSchema,
    outputSchema: GeneratePayslipEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
