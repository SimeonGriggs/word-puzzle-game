// REQUIREMENTS THAT CANNOT BE AVOIDED
// This is a script that will generate a word puzzle
// A word puzzle is a 6x8 grid
// Words are placed in the grid where one letter is adjacent to the next
// Words are never horizontal or vertical or purely diagonal
// Letters are only ever used once
// Words must be unique
// Words must be at least 4 letters
// Puzzles should contain 7-10 words of varying lengths

import fs from "fs";
import path from "path";

interface Position {
  row: number;
  col: number;
}

interface ScoredPosition extends Position {
  score: number;
}

interface PlacedWord {
  word: string;
  positions: Position[];
}

class GridGenerator {
  private readonly GRID_ROWS = 8;
  private readonly GRID_COLS = 6;
  private readonly GRID_SIZE = this.GRID_ROWS * this.GRID_COLS; // 48 cells
  private readonly MIN_WORD_LENGTH = 4;
  private readonly MAX_WORD_LENGTH = 8;
  private readonly MAX_ATTEMPTS = 1000;
  private readonly MAX_RESHUFFLES = 5;
  private readonly DESIRED_WORD_COUNT = { min: 7, max: 9 };

  private grid: string[][];
  private usedPositions: Set<string>;
  private words: PlacedWord[];
  private dictionary: string[];

  constructor() {
    this.grid = Array(this.GRID_ROWS)
      .fill(null)
      .map(() => Array(this.GRID_COLS).fill(""));
    this.usedPositions = new Set();
    this.words = [];

    // Load dictionary
    const dictPath = path.join(
      // STOP CHANGING THIS PATH
      process.cwd().split("/").slice(0, -1).join("/"),
      "public",
      "data",
      "enable1.txt"
    );
    const dictContent = fs.readFileSync(dictPath, "utf-8");
    this.dictionary = dictContent
      .split("\n")
      .filter(
        (word) =>
          word.length >= this.MIN_WORD_LENGTH &&
          word.length <= this.MAX_WORD_LENGTH &&
          !/[^a-zA-Z]/.test(word)
      )
      .map((word) => word.toUpperCase());
  }

  private posToString(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  private stringToPos(str: string): Position {
    const [row, col] = str.split(",").map(Number);
    return { row, col };
  }

  private isValidPosition(pos: Position): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.GRID_ROWS &&
      pos.col >= 0 &&
      pos.col < this.GRID_COLS
    );
  }

  private getNeighbors(pos: Position): Position[] {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    return directions
      .map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc }))
      .filter((newPos) => this.isValidPosition(newPos));
  }

  private removeWord(word: PlacedWord): void {
    word.positions.forEach((pos) => {
      this.grid[pos.row][pos.col] = "";
      this.usedPositions.delete(this.posToString(pos));
    });
    this.words = this.words.filter((w) => w.word !== word.word);
  }

  private findWordAtPosition(pos: Position): PlacedWord | null {
    return (
      this.words.find((word) =>
        word.positions.some((p) => p.row === pos.row && p.col === pos.col)
      ) || null
    );
  }

  private canPlaceWordAt(
    word: string,
    startPos: Position,
    ignoreWord?: PlacedWord
  ): Position[] | null {
    const positions: Position[] = [startPos];
    let currentPos = startPos;
    const usedInPath = new Set([this.posToString(startPos)]);

    // Try to place each remaining letter
    for (let i = 1; i < word.length; i++) {
      const neighbors = this.getNeighbors(currentPos).filter((pos) => {
        const posStr = this.posToString(pos);
        if (usedInPath.has(posStr)) return false;

        // Allow positions used by the word we're ignoring
        if (
          ignoreWord &&
          ignoreWord.positions.some(
            (p) => p.row === pos.row && p.col === pos.col
          )
        ) {
          return true;
        }

        return !this.usedPositions.has(posStr);
      });

      if (neighbors.length === 0) return null;

      // Prioritize neighbors that have more empty adjacent cells
      const neighborScores = neighbors.map((pos) => ({
        pos,
        score: this.getNeighbors(pos).filter((n) => {
          const nStr = this.posToString(n);
          if (usedInPath.has(nStr)) return false;
          if (
            ignoreWord &&
            ignoreWord.positions.some((p) => p.row === n.row && p.col === n.col)
          ) {
            return true;
          }
          return !this.usedPositions.has(nStr);
        }).length,
      }));

      neighborScores.sort((a, b) => b.score - a.score);
      const topNeighbors = neighborScores.slice(0, 3);
      const nextPos =
        topNeighbors[Math.floor(Math.random() * topNeighbors.length)].pos;

      positions.push(nextPos);
      usedInPath.add(this.posToString(nextPos));
      currentPos = nextPos;
    }

    // Verify the path isn't purely horizontal, vertical, or diagonal
    let isSimplePath = true;
    for (let i = 2; i < positions.length; i++) {
      const v1 = {
        row: positions[i - 1].row - positions[i - 2].row,
        col: positions[i - 1].col - positions[i - 2].col,
      };
      const v2 = {
        row: positions[i].row - positions[i - 1].row,
        col: positions[i].col - positions[i - 1].col,
      };
      if (v1.row !== v2.row || v1.col !== v2.col) {
        isSimplePath = false;
        break;
      }
    }

    return isSimplePath ? null : positions;
  }

  private tryPlaceWord(word: string, ignoreWord?: PlacedWord): boolean {
    const startPositions: ScoredPosition[] = [];

    // Get all available positions
    for (let row = 0; row < this.GRID_ROWS; row++) {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const pos = { row, col };
        const posStr = this.posToString(pos);

        if (
          !this.usedPositions.has(posStr) ||
          (ignoreWord &&
            ignoreWord.positions.some((p) => p.row === row && p.col === col))
        ) {
          const neighborCount = this.getNeighbors(pos).filter((n) => {
            const nStr = this.posToString(n);
            return (
              !this.usedPositions.has(nStr) ||
              (ignoreWord &&
                ignoreWord.positions.some(
                  (p) => p.row === n.row && p.col === n.col
                ))
            );
          }).length;
          startPositions.push({ ...pos, score: neighborCount });
        }
      }
    }

    startPositions.sort((a, b) => b.score - a.score);
    const topPositions = startPositions.slice(
      0,
      Math.max(5, startPositions.length)
    );

    for (const startPos of topPositions) {
      const positions = this.canPlaceWordAt(word, startPos, ignoreWord);
      if (positions) {
        positions.forEach((pos, idx) => {
          this.grid[pos.row][pos.col] = word[idx];
          this.usedPositions.add(this.posToString(pos));
        });
        this.words.push({ word, positions });
        return true;
      }
    }

    return false;
  }

  private selectWords(): string[] {
    const targetLength = this.GRID_SIZE;
    const selectedWords: string[] = [];
    let currentLength = 0;

    // Group words by length
    const wordsByLength = new Map<number, string[]>();
    for (const word of this.dictionary) {
      const len = word.length;
      if (!wordsByLength.has(len)) {
        wordsByLength.set(len, []);
      }
      wordsByLength.get(len)!.push(word);
    }

    const lengths = Array.from(wordsByLength.keys()).sort((a, b) => a - b);

    // First, select words until we're close to but not exceeding the target
    while (
      currentLength < targetLength - this.MAX_WORD_LENGTH &&
      selectedWords.length < this.DESIRED_WORD_COUNT.max - 1
    ) {
      const availableLengths = lengths.filter(
        (len) => currentLength + len <= targetLength - this.MIN_WORD_LENGTH
      );

      if (availableLengths.length === 0) break;

      const lenIndex = Math.floor(Math.random() * availableLengths.length);
      const len = availableLengths[lenIndex];
      const words = wordsByLength.get(len)!;

      if (words.length > 0) {
        const wordIndex = Math.floor(Math.random() * words.length);
        const word = words[wordIndex];
        selectedWords.push(word);
        currentLength += word.length;
        words.splice(wordIndex, 1);
      }
    }

    // Finally, find a word that exactly fills the remaining space
    const remainingLength = targetLength - currentLength;
    if (
      remainingLength >= this.MIN_WORD_LENGTH &&
      remainingLength <= this.MAX_WORD_LENGTH &&
      wordsByLength.has(remainingLength)
    ) {
      const words = wordsByLength.get(remainingLength)!;
      if (words.length > 0) {
        const word = words[Math.floor(Math.random() * words.length)];
        selectedWords.push(word);
      }
    }

    return selectedWords;
  }

  private tryReshuffle(finalWord: string): boolean {
    let reshuffleAttempts = 0;
    const maxReshuffles = this.MAX_RESHUFFLES;

    while (reshuffleAttempts < maxReshuffles) {
      // Try removing each existing word and see if it helps
      for (let i = 0; i < this.words.length; i++) {
        const wordToMove = this.words[i];
        this.removeWord(wordToMove);

        // Try placing the final word
        if (this.tryPlaceWord(finalWord)) {
          // Success! Now try to place back the word we removed
          if (this.tryPlaceWord(wordToMove.word)) {
            return true;
          }
          // If we couldn't place back the original word, undo and continue
          this.removeWord({
            word: finalWord,
            positions: this.words[this.words.length - 1].positions,
          });
        }

        // Put the word back and try the next one
        this.words.push(wordToMove);
        wordToMove.positions.forEach((pos) => {
          this.grid[pos.row][pos.col] =
            wordToMove.word[wordToMove.positions.indexOf(pos)];
          this.usedPositions.add(this.posToString(pos));
        });
      }

      reshuffleAttempts++;
    }

    return false;
  }

  public generate(): {
    grid: string[][];
    words: PlacedWord[];
    coverage: number;
  } | null {
    let attempts = 0;
    let bestResult: {
      grid: string[][];
      words: PlacedWord[];
      coverage: number;
    } | null = null;

    while (attempts < this.MAX_ATTEMPTS) {
      this.grid = Array(this.GRID_ROWS)
        .fill(null)
        .map(() => Array(this.GRID_COLS).fill(""));
      this.usedPositions.clear();
      this.words = [];

      const selectedWords = this.selectWords();
      let allPlaced = true;

      // Try to place all words except the last one
      for (let i = 0; i < selectedWords.length - 1; i++) {
        if (!this.tryPlaceWord(selectedWords[i])) {
          allPlaced = false;
          break;
        }
      }

      if (allPlaced) {
        // Try to place the final word
        const finalWord = selectedWords[selectedWords.length - 1];
        if (!this.tryPlaceWord(finalWord)) {
          // If we can't place it, try reshuffling
          if (!this.tryReshuffle(finalWord)) {
            allPlaced = false;
          }
        }
      }

      if (allPlaced) {
        const coverage = this.usedPositions.size;
        if (!bestResult || coverage > bestResult.coverage) {
          bestResult = {
            grid: this.grid.map((row) => [...row]),
            words: [...this.words],
            coverage: coverage,
          };

          if (coverage === this.GRID_SIZE) {
            return bestResult;
          }
        }
      }

      attempts++;
    }

    return bestResult ? bestResult : null;
  }
}

export default GridGenerator;
