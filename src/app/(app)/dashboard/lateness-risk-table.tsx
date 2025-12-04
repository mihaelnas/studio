
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, MessageCircleQuestion, AlertTriangle, BrainCircuit, Info } from "lucide-react";
import { getLatenessExplanation, getLatenessPrediction } from "@/lib/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from '@/lib/types';
import type { PredictLatenessRiskOutput } from '@/ai/flows/predict-lateness-risk';
import { Skeleton } from '@/components/ui/skeleton';

export function LatenessRiskTable() {
    
  return (
    <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Fonctionnalité Indisponible</AlertTitle>
        <AlertDescription>
            La section d'analyse des risques de retard est temporairement désactivée en raison d'un problème persistant de permissions.
        </AlertDescription>
    </Alert>
  );
}

