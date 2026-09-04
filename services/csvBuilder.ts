
import { ParsedQuestion, QuestionType, ANS_CSV_HEADER } from '../types';

/**
 * Sanitizes text according to ANS import rules:
 * 1. No newlines -> <br>
 * 2. No double quotes -> single quotes
 * 3. No semicolons -> commas
 */
const sanitize = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\r?\n/g, '<br>')
    .replace(/"/g, "'")
    .replace(/;/g, ',');
};

export const generateAnsCsv = (questions: ParsedQuestion[]): string => {
  const rows = questions.map((q, index) => {
    const formattedId = q.id || `Question ${String(index + 1).padStart(2, '0')}`;
    const cleanQuestion = sanitize(q.questionText);
    const cleanTopic = sanitize(q.topic);
    const cleanDifficulty = sanitize(q.difficulty);
    const cleanBloom = sanitize(q.bloom);

    if (q.type === QuestionType.MC) {
      // MC Mapping:
      // mc;[ID];1;[Vraag];a;[Juist];[Fout1];[Fout2];[Fout3];... (34 cols)
      const cleanCorrect = sanitize(q.correctAnswer);
      const cleanFeedback = sanitize(q.correctFeedback);

      const dists = q.distractors || [];
      const d1 = sanitize(dists[0] || '');
      const d2 = sanitize(dists[1] || '');
      const d3 = sanitize(dists[2] || '');

      const fields = [
        'mc',                       // 1: Type
        formattedId,                // 2: Titel/ID
        '1',                        // 3: Punten
        cleanQuestion,              // 4: Vraagstelling
        'a',                        // 5: Juist antwoord (Letter)
        cleanCorrect,               // 6: Keuze 1 (Correcte tekst)
        d1,                         // 7: Keuze 2
        d2,                         // 8: Keuze 3
        d3,                         // 9: Keuze 4
        '', '', '', '', '', '', '', // 10-16
        cleanFeedback,              // 17: Juiste feedback (Header says Juiste feedback is col 17)
        '', '', '', '', '', '', '', '', '', '', // 18-27
        '',                         // 28
        cleanTopic,                 // 29: Onderwerp
        cleanDifficulty,            // 30: Moeilijkheidsniveau
        cleanBloom,                 // 31: Meta 1 (Bloom)
        '', '', ''                  // 32-34
      ];

      return fields.join(';');

    } else {
      // ES Mapping with strict Bridges:
      // es;[ID];1;[Vraagstelling];;;;;;;;;;;[Modelantwoord];;;;;;;;;;;;;[Onderwerp];[Moeilijkheid];[Meta1];;;

      const cleanModel = sanitize(q.modelAnswer);

      // Part 1: First 4 columns
      const p1 = `es;${formattedId};1;${cleanQuestion}`;

      // Bridge 1: 11 semicolons
      const b1 = ';;;;;;;;;;;';

      // Model Answer is field 16 (matches 11 semicolons after field 4: 5,6,7,8,9,10,11,12,13,14,15 are empty)
      const p2 = cleanModel;

      // Bridge 2: 12 semicolons after field 16 to get to field 29 (17,18,19,20,21,22,23,24,25,26,27,28 are empty)
      const b2 = ';;;;;;;;;;;;';

      // Part 3: Meta data starting at field 29
      const p3 = `${cleanTopic};${cleanDifficulty};${cleanBloom};;;`;

      return `${p1}${b1}${p2}${b2}${p3}`;
    }
  });

  return [ANS_CSV_HEADER, ...rows].join('\n');
};
