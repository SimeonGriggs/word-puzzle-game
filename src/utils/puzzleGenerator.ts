interface Position {
  row: number;
  col: number;
}

interface PlacedWord {
  word: string;
  positions: Position[];
}

interface PuzzleResult {
  grid: string[][];
  words: PlacedWord[];
  coverage: number;
  theme: string;
}

export function generatePuzzle(
  theme: string,
  wordList: string[]
): PuzzleResult | null {
  const GRID_ROWS = 8;
  const GRID_COLS = 6;
  const GRID_SIZE = GRID_ROWS * GRID_COLS; // 48 cells
  const MIN_WORD_LENGTH = 4;
  const MAX_WORD_LENGTH = 8;
  const MAX_ATTEMPTS = 1000;
  const MAX_RESHUFFLES = 5;
  const DESIRED_WORD_COUNT = { min: 7, max: 9 };

  let grid = Array(GRID_ROWS)
    .fill(null)
    .map(() => Array(GRID_COLS).fill(""));
  const usedPositions = new Set<string>();
  let words: PlacedWord[] = [];

  // Filter and prepare dictionary
  const dictionary = wordList
    .filter(
      (word) =>
        word.length >= MIN_WORD_LENGTH &&
        word.length <= MAX_WORD_LENGTH &&
        !/[^a-zA-Z]/.test(word)
    )
    .map((word) => word.toUpperCase());

  function posToString(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  function isValidPosition(pos: Position): boolean {
    return (
      pos.row >= 0 && pos.row < GRID_ROWS && pos.col >= 0 && pos.col < GRID_COLS
    );
  }

  function getNeighbors(pos: Position): Position[] {
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
      .filter((newPos) => isValidPosition(newPos));
  }

  function removeWord(word: PlacedWord): void {
    word.positions.forEach((pos) => {
      grid[pos.row][pos.col] = "";
      usedPositions.delete(posToString(pos));
    });
    words = words.filter((w) => w.word !== word.word);
  }

  function canPlaceWordAt(
    word: string,
    startPos: Position,
    ignoreWord?: PlacedWord
  ): Position[] | null {
    const positions: Position[] = [startPos];
    let currentPos = startPos;
    const usedInPath = new Set([posToString(startPos)]);

    // Try to place each remaining letter
    for (let i = 1; i < word.length; i++) {
      const neighbors = getNeighbors(currentPos).filter((pos) => {
        const posStr = posToString(pos);
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

        return !usedPositions.has(posStr);
      });

      if (neighbors.length === 0) return null;

      // Prioritize neighbors that have more empty adjacent cells
      const neighborScores = neighbors.map((pos) => ({
        pos,
        score: getNeighbors(pos).filter((n) => {
          const nStr = posToString(n);
          if (usedInPath.has(nStr)) return false;
          if (
            ignoreWord &&
            ignoreWord.positions.some((p) => p.row === n.row && p.col === n.col)
          ) {
            return true;
          }
          return !usedPositions.has(nStr);
        }).length,
      }));

      neighborScores.sort((a, b) => b.score - a.score);
      const topNeighbors = neighborScores.slice(0, 3);
      const nextPos =
        topNeighbors[Math.floor(Math.random() * topNeighbors.length)].pos;

      positions.push(nextPos);
      usedInPath.add(posToString(nextPos));
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

  function tryPlaceWord(word: string, ignoreWord?: PlacedWord): boolean {
    const startPositions: Array<Position & { score: number }> = [];

    // Get all available positions
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const pos = { row, col };
        const posStr = posToString(pos);

        if (
          !usedPositions.has(posStr) ||
          (ignoreWord &&
            ignoreWord.positions.some((p) => p.row === row && p.col === col))
        ) {
          const neighborCount = getNeighbors(pos).filter((n) => {
            const nStr = posToString(n);
            return (
              !usedPositions.has(nStr) ||
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
      const positions = canPlaceWordAt(word, startPos, ignoreWord);
      if (positions) {
        positions.forEach((pos, idx) => {
          grid[pos.row][pos.col] = word[idx];
          usedPositions.add(posToString(pos));
        });
        words.push({ word, positions });
        return true;
      }
    }

    return false;
  }

  function selectWords(): string[] {
    const targetLength = GRID_SIZE;
    const selectedWords: string[] = [];
    let currentLength = 0;

    // Group words by length
    const wordsByLength = new Map<number, string[]>();
    for (const word of dictionary) {
      const len = word.length;
      if (!wordsByLength.has(len)) {
        wordsByLength.set(len, []);
      }
      wordsByLength.get(len)!.push(word);
    }

    const lengths = Array.from(wordsByLength.keys()).sort((a, b) => a - b);

    // First, select words until we're close to but not exceeding the target
    while (
      currentLength < targetLength - MAX_WORD_LENGTH &&
      selectedWords.length < DESIRED_WORD_COUNT.max - 1
    ) {
      const availableLengths = lengths.filter(
        (len) => currentLength + len <= targetLength - MIN_WORD_LENGTH
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
      remainingLength >= MIN_WORD_LENGTH &&
      remainingLength <= MAX_WORD_LENGTH &&
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

  function tryReshuffle(finalWord: string): boolean {
    let reshuffleAttempts = 0;

    while (reshuffleAttempts < MAX_RESHUFFLES) {
      // Try removing each existing word and see if it helps
      for (let i = 0; i < words.length; i++) {
        const wordToMove = words[i];
        removeWord(wordToMove);

        // Try placing the final word
        if (tryPlaceWord(finalWord)) {
          // Success! Now try to place back the word we removed
          if (tryPlaceWord(wordToMove.word)) {
            return true;
          }
          // If we couldn't place back the original word, undo and continue
          removeWord({
            word: finalWord,
            positions: words[words.length - 1].positions,
          });
        }

        // Put the word back and try the next one
        words.push(wordToMove);
        wordToMove.positions.forEach((pos) => {
          grid[pos.row][pos.col] =
            wordToMove.word[wordToMove.positions.indexOf(pos)];
          usedPositions.add(posToString(pos));
        });
      }

      reshuffleAttempts++;
    }

    return false;
  }

  let attempts = 0;
  let bestResult: PuzzleResult | null = null;

  while (attempts < MAX_ATTEMPTS) {
    grid = Array(GRID_ROWS)
      .fill(null)
      .map(() => Array(GRID_COLS).fill(""));
    usedPositions.clear();
    words = [];

    const selectedWords = selectWords();
    let allPlaced = true;

    // Try to place all words except the last one
    for (let i = 0; i < selectedWords.length - 1; i++) {
      if (!tryPlaceWord(selectedWords[i])) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      // Try to place the final word
      const finalWord = selectedWords[selectedWords.length - 1];
      if (!tryPlaceWord(finalWord)) {
        // If we can't place it, try reshuffling
        if (!tryReshuffle(finalWord)) {
          allPlaced = false;
        }
      }
    }

    if (allPlaced) {
      const coverage = usedPositions.size;
      if (!bestResult || coverage > bestResult.coverage) {
        bestResult = {
          grid: grid.map((row) => [...row]),
          words: [...words],
          coverage,
          theme,
        };

        if (coverage === GRID_SIZE) {
          return bestResult;
        }
      }
    }

    attempts++;
  }

  return bestResult;
}
