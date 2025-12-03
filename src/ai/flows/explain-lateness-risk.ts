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
  employeeId: z.string().describe("L'ID de l'employé."),
});
export type ExplainLatenessRiskInput = z.infer<typeof ExplainLatenessRiskInputSchema>;

const ExplainLatenessRiskOutputSchema = z.object({
  explanation: z.string().describe("L'explication générée par l'IA expliquant pourquoi l'employé est signalé pour un risque de retard."),
});
export type ExplainLatenessRiskOutput = z.infer<typeof ExplainLatenessRiskOutputSchema>;

export async function explainLatenessRisk(input: ExplainLatenessRiskInput): Promise<ExplainLatenessRiskOutput> {
  return explainLatenessRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainLatenessRiskPrompt',
  input: {schema: ExplainLatenessRiskInputSchema},
  output: {schema: ExplainLatenessRiskOutputSchema},
  prompt: `Vous êtes un analyste des ressources humaines. Étant donné l'ID de l'employé : {{{employeeId}}}, analysez les données de présence historiques et fournissez une brève explication de la raison pour laquelle cet employé est signalé pour un risque de retard. Concentrez-vous sur des schémas tels que des retards fréquents certains jours ou après certains événements.`,
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
