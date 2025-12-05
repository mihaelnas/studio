'use server';

/**
 * @fileOverview Suggerère une assignation de tâche basée sur la performance récente d'un employé.
 * 
 * - suggestTaskForEmployee - Une fonction qui analyse les données de performance et suggère un type de tâche.
 * - SuggestTaskInput - Le type d'entrée pour la fonction.
 * - SuggestTaskOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SuggestTaskInputSchema = z.object({
    employeeName: z.string().describe("Le nom de l'employé."),
    avgWorkedHours: z.number().describe("La moyenne d'heures travaillées par jour sur la période récente."),
    totalLateMinutes: z.number().describe("Le total des minutes de retard sur la période récente."),
    totalOvertimeMinutes: z.number().describe("Le total des minutes d'heures supplémentaires sur la période récente."),
});
export type SuggestTaskInput = z.infer<typeof SuggestTaskInputSchema>;

export const SuggestTaskOutputSchema = z.object({
    recommendation: z.string().describe("Une recommandation concise (une phrase) sur le type de tâche à assigner à l'employé."),
});
export type SuggestTaskOutput = z.infer<typeof SuggestTaskOutputSchema>;


export async function suggestTaskForEmployee(input: SuggestTaskInput): Promise<SuggestTaskOutput> {
    return suggestTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPrompt',
  input: { schema: SuggestTaskInputSchema },
  output: { schema: SuggestTaskOutputSchema },
  prompt: `Tu es un assistant RH intelligent. Ton rôle est de fournir une recommandation pour l'assignation de tâches en te basant sur les performances récentes d'un employé.

  Voici les données pour l'employé '{{{employeeName}}}':
  - Moyenne d'heures par jour : {{{avgWorkedHours}}}
  - Total des retards : {{{totalLateMinutes}}} minutes
  - Total des heures supplémentaires : {{{totalOvertimeMinutes}}} minutes

  Analyse ces données et fournis une recommandation en une seule phrase.
  - Si les heures supplémentaires sont élevées (> 500 min), suggère une tâche moins exigeante pour éviter le surmenage.
  - Si les retards sont élevés (> 60 min), suggère des tâches non-critiques pour le début de journée.
  - Si les heures sont basses (< 7h/jour) et les retards faibles, suggère que l'employé peut prendre plus de responsabilités.
  - Si l'employé est ponctuel et performant, mentionne qu'il est fiable pour les tâches importantes.

  Sois concis et direct.`,
});


const suggestTaskFlow = ai.defineFlow(
  {
    name: 'suggestTaskFlow',
    inputSchema: SuggestTaskInputSchema,
    outputSchema: SuggestTaskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
