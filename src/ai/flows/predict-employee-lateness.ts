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
  employeeId: z.string().describe("L'ID de l'employé."),
  historicalAttendanceData: z.string().describe("Données historiques de présence de l'employé."),
});
export type PredictEmployeeLatenessInput = z.infer<typeof PredictEmployeeLatenessInputSchema>;

const PredictEmployeeLatenessOutputSchema = z.object({
  isLatenessPredicted: z.boolean().describe("Indique si un retard est prédit pour l'employé."),
  reason: z.string().describe("La raison du retard prédit."),
  riskLevel: z.enum(['Élevé', 'Moyen', 'Faible']).describe("Le niveau de risque de retard."),
});
export type PredictEmployeeLatenessOutput = z.infer<typeof PredictEmployeeLatenessOutputSchema>;

export async function predictEmployeeLateness(input: PredictEmployeeLatenessInput): Promise<PredictEmployeeLatenessOutput> {
  return predictEmployeeLatenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictEmployeeLatenessPrompt',
  input: {schema: PredictEmployeeLatenessInputSchema},
  output: {schema: PredictEmployeeLatenessOutputSchema},
  prompt: `Vous êtes un analyste RH qui prédit les retards des employés en se basant sur les données historiques de présence.

  Analysez les données historiques de présence suivantes pour l'employé :
  ID de l'employé : {{{employeeId}}}
  Données historiques de présence : {{{historicalAttendanceData}}}

  Sur la base de ces données, prédisez si l'employé est susceptible d'être en retard.
  Fournissez une raison pour votre prédiction et un niveau de risque (Élevé, Moyen, Faible).

  Sortie au format JSON :
  {
    "isLatenessPredicted": true ou false,
    "reason": "raison du retard prédit",
    "riskLevel": "Élevé, Moyen, ou Faible"
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
