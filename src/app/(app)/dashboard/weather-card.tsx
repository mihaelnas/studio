'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getWeatherForecast } from '@/ai/tools/weather';
import type { z } from 'genkit';
import { Sun, Cloudy, CloudRain, Loader, Wind } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type WeatherForecast = z.infer<typeof getWeatherForecast.outputSchema>;

const WeatherIcon = ({ forecast }: { forecast?: string }) => {
    const lowercasedForecast = forecast?.toLowerCase() || '';
    if (lowercasedForecast.includes('soleil') || lowercasedForecast.includes('ensoleillé')) {
        return <Sun className="w-16 h-16 text-yellow-500" />;
    }
    if (lowercasedForecast.includes('pluie')) {
        return <CloudRain className="w-16 h-16 text-blue-500" />;
    }
    if (lowercasedForecast.includes('nuageux') || lowercasedForecast.includes('nuages')) {
        return <Cloudy className="w-16 h-16 text-gray-500" />;
    }
    return <Wind className="w-16 h-16 text-gray-400" />;
};


export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        // La date est optionnelle, l'outil prendra la date du jour par défaut
        const forecast = await getWeatherForecast({ location: 'Antananarivo, Madagascar' });
        setWeather(forecast);
        setError(null);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Impossible de charger les prévisions météo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Météo à Antananarivo</CardTitle>
        <CardDescription>Prévisions pour demain.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-around gap-4">
        {isLoading ? (
          <Skeleton className="h-[100px] w-full" />
        ) : error ? (
            <Alert variant="destructive" className="w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : weather ? (
          <>
            <div className="flex-shrink-0">
                <WeatherIcon forecast={weather.forecast} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{weather.chanceOfRain}%</p>
              <p className="text-muted-foreground capitalize">de chance de pluie</p>
              <p className="text-sm text-muted-foreground capitalize mt-1">{weather.forecast}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
