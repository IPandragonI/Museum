"use client";

import { useCallback, useRef, useState } from "react";
import { sumPoints } from "@/lib/game/scoring";
import type { QuestionResult } from "@/lib/types";

interface Options {
  total: number;
  initial: QuestionResult[];
  onProgress?: (answers: QuestionResult[]) => void;
  onComplete: (answers: QuestionResult[]) => void;
}

/**
 * Tiny state machine shared by the three multiple-choice modes:
 *   asking(index) --submit--> answered(index) --next--> asking(index+1) | complete
 */
export function useGameFlow({ total, initial, onProgress, onComplete }: Options) {
  const [answers, setAnswers] = useState<QuestionResult[]>(initial);
  const [answered, setAnswered] = useState(false);
  const completed = useRef(false);

  const index = answered ? answers.length - 1 : Math.min(answers.length, total - 1);
  const last = answers.length - (answered ? 1 : 0);

  const submit = useCallback(
    (result: QuestionResult) => {
      setAnswers((prev) => {
        const next = [...prev, result];
        onProgress?.(next);
        return next;
      });
      setAnswered(true);
    },
    [onProgress],
  );

  const next = useCallback(() => {
    if (answers.length >= total) {
      if (!completed.current) {
        completed.current = true;
        onComplete(answers);
      }
      return;
    }
    setAnswered(false);
  }, [answers, total, onComplete]);

  return {
    index,
    answers,
    answered,
    current: answered ? answers[answers.length - 1] : null,
    isLast: answers.length >= total,
    score: sumPoints(answers),
    submit,
    next,
    pending: last,
  };
}
