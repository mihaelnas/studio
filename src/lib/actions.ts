'use server';

import { explainLatenessRisk } from '@/ai/flows/explain-lateness-risk';
import { predictLatenessRisk } from '@/ai/flows/predict-lateness-risk';
import type { PredictLatenessRiskOutput } from '@/ai/flows/predict-lateness-risk';

export async function getLatenessExplanation(employeeId: string): Promise<string> {
  try {
    const result = await explainLatenessRisk({ employeeId });
    return result.explanation;
  } catch (error) {
    console.error('Error fetching lateness explanation:', error);
    return "Une erreur est survenue lors de la génération de l'explication.";
  }
}

export async function getLatenessPrediction(
  historicalData: string
): Promise<PredictLatenessRiskOutput | null> {
  try {
    const result = await predictLatenessRisk({
      historicalAttendanceData: historicalData,
    });
    return result;
  } catch (error) {
    console.error('Error fetching lateness prediction:', error);
    return null;
  }
}

export async function sendPayslipsByEmail(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('Simulating sending payslips by email...');
  // In a real application, you would:
  // 1. Calculate the final payroll for the month for all employees.
  // 2. Generate a PDF or formatted email for each payslip.
  // 3. Use an email service (like SendGrid, Nodemailer, etc.) to send the emails.

  // For now, we'll just simulate a successful operation.
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

  console.log('Payslips sent successfully (simulation).');
  return {
    success: true,
    message: 'Les fiches de paie ont été envoyées avec succès.',
  };
}
