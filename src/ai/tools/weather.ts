'use server';

/**
 * @fileOverview Outil IA pour obtenir les prévisions météo.
 * - getWeatherForecast - Un outil que l'IA peut appeler pour obtenir la météo.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const getWeatherForecast = ai.defineTool(
  {
    name: 'getWeatherForecast',
    description: 'Obtient les prévisions météo pour un lieu et une date donnés. Par défaut, Antananarivo, Madagascar.',
    inputSchema: z.object({
      location: z.string().default('Antananarivo, Madagascar').describe('Le lieu pour lequel obtenir les prévisions météo.'),
      date: z.string().optional().describe("La date pour laquelle obtenir les prévisions (par défaut, demain). Format AAAA-MM-JJ."),
    }),
    outputSchema: z.object({
      forecast: z.string().describe("Une description textuelle des prévisions météo (par exemple, 'Ensoleillé', 'Pluies éparses', 'Fortes pluies attendues')."),
      chanceOfRain: z.number().describe('La probabilité de pluie en pourcentage (0-100).'),
    }),
  },
  async (input) => {
    console.log(`Appel de l'outil getWeatherForecast avec l'entrée : ${JSON.stringify(input)}`);

    // Logique de simulation : Dans une application réelle, vous appelleriez ici une véritable API météo.
    // Pour la démonstration, nous simulons une réponse.
    // Simulons une forte probabilité de pluie pour rendre les prédictions de l'IA plus intéressantes.
    const chanceOfRain = Math.floor(Math.random() * 40) + 60; // 60% à 100% de chance de pluie

    let forecast = 'Pluies éparses';
    if (chanceOfRain > 85) {
      forecast = 'Fortes pluies attendues';
    } else if (chanceOfRain > 70) {
      forecast = 'Pluie probable';
    }

    return {
      forecast,
      chanceOfRain,
    };
  }
);
