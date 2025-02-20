export interface Position {
  row: number;
  col: number;
}

export interface WordPlacement {
  word: string;
  startPosition: Position;
  direction:
    | "horizontal"
    | "vertical"
    | "diagonal-down"
    | "diagonal-up"
    | "snake";
  path: Position[];
}

export interface Theme {
  name: string;
  words: string[];
  description: string;
}

export interface Solution {
  word: string;
  path: Position[];
}

export interface GeneratedPuzzle {
  id: string;
  theme: string;
  difficulty: "easy" | "medium" | "hard";
  grid: string[][];
  validWords: string[];
  placements: WordPlacement[];
  // Store solution paths for the solve feature
  solutions: Solution[];
}
