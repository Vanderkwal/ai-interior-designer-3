export enum QuestionType {
  MC = 'mc',
  ES = 'es'
}

export interface ParsedQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  // MC specific
  correctAnswer?: string;
  distractors?: string[]; // Should be 3 distractors usually
  correctFeedback?: string;
  // ES specific
  modelAnswer?: string;
  // Meta / Tagging
  topic?: string;      // Tag 1: Doel/Onderwerp
  bloom?: string;      // Tag 2: Bloom Taxonomy
  difficulty?: string; // Tag 3: Difficulty (Makkelijk/Gemiddeld/Moeilijk)

  // QA Report
  validationLog?: string; // "Deel A" - Score and notes
}

export interface ProcessingStatus {
  step: 'idle' | 'reading' | 'analyzing' | 'building' | 'complete' | 'error';
  message?: string;
}

export const ANS_CSV_HEADER = "Type;Titel/ID;Punten;Vraagstelling;Juist antwoord;Keuze 1;Keuze 2;Keuze 3;Keuze 4;Keuze 5;Keuze 6;Keuze 7;Keuze 8;Keuze 9;Keuze 10;Algemene feedback;Juiste feedback;Onjuiste feedback;Feedback 1;Feedback 2;Feedback 3;Feedback 4;Feedback 5;Feedback 6;Feedback 7;Feedback 8;Feedback 9;Feedback 10;Onderwerp;Moeilijkheidsniveau;Meta 1;Meta 2;Meta 3;Meta 4";