/**
 * @fileOverview Types and schemas for the payslip generation flow.
 *
 * - GeneratePayslipEmailInput - The input type for the function.
 * - GeneratePayslipEmailOutput - The return type for the function.
 */

import { z } from 'zod';

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
