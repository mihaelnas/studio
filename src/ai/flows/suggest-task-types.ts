
/**
 * @fileOverview Types for the task suggestion flow.
 * 
 * - SuggestTaskInput - The input type for the function.
 * - SuggestTaskOutput - The return type for the function.
 */

import { z } from 'zod';

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
