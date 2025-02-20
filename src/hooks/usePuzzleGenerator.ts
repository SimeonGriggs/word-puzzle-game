import { useState, useCallback } from "react";
import { generatePuzzle } from "../utils/puzzleGenerator";
import { NFL_TEAMS } from "../utils/wordList";

interface PuzzleData {
  grid: string[][];
  validWords: string[];
  solutions: {
    word: string;
    path: { row: number; col: number }[];
  }[];
  theme: string;
}

export function usePuzzleGenerator() {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);

  const generateNewPuzzle = useCallback(() => {
    const result = generatePuzzle("NFL Teams", NFL_TEAMS);

    if (result) {
      const puzzleData: PuzzleData = {
        theme: result.theme,
        grid: result.grid,
        validWords: result.words.map((w) => w.word),
        solutions: result.words.map((w) => ({
          word: w.word,
          path: w.positions,
        })),
      };
      setPuzzleData(puzzleData);
      return true;
    }

    return false;
  }, []);

  return {
    puzzleData,
    generateNewPuzzle,
  };
}
