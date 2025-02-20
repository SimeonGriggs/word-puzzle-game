import { Position, WordPlacement } from "./types";

interface GridSpace {
  positions: Position[];
  connectedLetters: { pos: Position; letter: string }[];
  length: number;
}

export class WordPlacer {
  private grid: string[][];
  private readonly rows: number;
  private readonly cols: number;
  private usedPositions: Set<string>; // Track positions that have been used

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(""));
    this.usedPositions = new Set();
  }

  private positionToKey(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  private isPositionValid(pos: Position, letter: string): boolean {
    if (
      pos.row < 0 ||
      pos.row >= this.rows ||
      pos.col < 0 ||
      pos.col >= this.cols
    ) {
      return false;
    }

    const posKey = this.positionToKey(pos);
    const currentLetter = this.grid[pos.row][pos.col];

    // Position is valid if:
    // 1. It's empty and unused
    // 2. It has the same letter we want to place (intersection)
    return (
      (!this.usedPositions.has(posKey) && currentLetter === "") ||
      currentLetter === letter
    );
  }

  private getAdjacentPositions(pos: Position, letter: string = ""): Position[] {
    const adjacent: Position[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newPos = { row: pos.row + dr, col: pos.col + dc };
        if (
          letter === ""
            ? this.isEmptyPosition(newPos)
            : this.isPositionValid(newPos, letter)
        ) {
          adjacent.push(newPos);
        }
      }
    }
    return adjacent;
  }

  private isEmptyPosition(pos: Position): boolean {
    if (
      pos.row < 0 ||
      pos.row >= this.rows ||
      pos.col < 0 ||
      pos.col >= this.cols
    ) {
      return false;
    }
    const posKey = this.positionToKey(pos);
    return (
      !this.usedPositions.has(posKey) && this.grid[pos.row][pos.col] === ""
    );
  }

  private findSnakePath(word: string, startPos: Position): Position[] | null {
    if (!this.isPositionValid(startPos, word[0])) {
      return null;
    }

    const visited = new Set<string>();
    const path: Position[] = [];

    // Calculate the current rectangular bounds of used positions
    const getBounds = () => {
      let minRow = this.rows,
        maxRow = 0,
        minCol = this.cols,
        maxCol = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] !== "") {
            minRow = Math.min(minRow, r);
            maxRow = Math.max(maxRow, r);
            minCol = Math.min(minCol, c);
            maxCol = Math.max(maxCol, c);
          }
        }
      }
      // If no letters placed yet, use center of grid
      if (minRow > maxRow) {
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        return {
          minRow: centerRow,
          maxRow: centerRow,
          minCol: centerCol,
          maxCol: centerCol,
        };
      }
      return { minRow, maxRow, minCol, maxCol };
    };

    const bounds = getBounds();

    // Score a position based on how well it maintains a rectangular shape
    const scorePosition = (pos: Position): number => {
      let score = 0;

      // Prefer positions that extend the current rectangle slightly
      const isWithinExtendedBounds =
        pos.row >= bounds.minRow - 1 &&
        pos.row <= bounds.maxRow + 1 &&
        pos.col >= bounds.minCol - 1 &&
        pos.col <= bounds.maxCol + 1;

      if (isWithinExtendedBounds) {
        score += 5;
      }

      // Penalize positions that would create a very non-rectangular shape
      const distToRect = Math.min(
        Math.abs(pos.row - bounds.minRow),
        Math.abs(pos.row - bounds.maxRow),
        Math.abs(pos.col - bounds.minCol),
        Math.abs(pos.col - bounds.maxCol)
      );
      score -= distToRect * 2;

      // Heavily penalize positions near corners if we're not already using that corner
      const isNearCorner =
        (pos.row <= 1 && pos.col <= 1) ||
        (pos.row <= 1 && pos.col >= this.cols - 2) ||
        (pos.row >= this.rows - 2 && pos.col <= 1) ||
        (pos.row >= this.rows - 2 && pos.col >= this.cols - 2);

      if (isNearCorner) {
        const cornerInUse = this.hasLettersInCornerRegion(pos);
        if (!cornerInUse) {
          score -= 10;
        }
      }

      // Reward positions that have neighbors
      score += this.countOccupiedNeighbors(pos) * 2;

      return score;
    };

    const dfs = (pos: Position, index: number): boolean => {
      if (index === word.length) {
        return true;
      }

      const posKey = this.positionToKey(pos);
      visited.add(posKey);
      path.push(pos);

      // Get adjacent positions for next letter
      const nextLetter = word[index];
      const adjacent = this.getAdjacentPositions(pos, nextLetter);

      // Score and sort adjacent positions
      adjacent.sort((a, b) => {
        const aScore = scorePosition(a);
        const bScore = scorePosition(b);
        return bScore - aScore;
      });

      for (const nextPos of adjacent) {
        const nextPosKey = this.positionToKey(nextPos);
        if (!visited.has(nextPosKey)) {
          if (dfs(nextPos, index + 1)) {
            return true;
          }
        }
      }

      visited.delete(posKey);
      path.pop();
      return false;
    };

    if (dfs(startPos, 0)) {
      return path;
    }
    return null;
  }

  private hasLettersInCornerRegion(pos: Position): boolean {
    // Check if there are any letters in the 2x2 corner region nearest to the position
    const cornerRow = pos.row < this.rows / 2 ? 0 : this.rows - 2;
    const cornerCol = pos.col < this.cols / 2 ? 0 : this.cols - 2;

    for (let r = cornerRow; r < cornerRow + 2; r++) {
      for (let c = cornerCol; c < cornerCol + 2; c++) {
        if (this.grid[r][c] !== "") {
          return true;
        }
      }
    }
    return false;
  }

  private countOccupiedNeighbors(pos: Position): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newPos = { row: pos.row + dr, col: pos.col + dc };
        if (
          newPos.row >= 0 &&
          newPos.row < this.rows &&
          newPos.col >= 0 &&
          newPos.col < this.cols &&
          this.grid[newPos.row][newPos.col] !== ""
        ) {
          count++;
        }
      }
    }
    return count;
  }

  private findAvailableSpaces(): GridSpace[] {
    const visited = new Set<string>();
    const spaces: GridSpace[] = [];
    const maxWordLength = 8; // Maximum word length we'll consider

    // Find potential starting positions for words
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const pos = { row, col };
        const posKey = this.positionToKey(pos);

        if (this.isEmptyPosition(pos) && !visited.has(posKey)) {
          // Try to find a path of length 4-8 from this position
          for (
            let targetLength = maxWordLength;
            targetLength >= 4;
            targetLength--
          ) {
            const space: GridSpace = {
              positions: [],
              connectedLetters: [],
              length: 0,
            };

            const pathVisited = new Set<string>();

            // Use DFS to find a path of exactly targetLength cells
            const dfs = (currentPos: Position): boolean => {
              const currentKey = this.positionToKey(currentPos);
              if (pathVisited.has(currentKey)) return false;
              if (space.length >= targetLength) return true;

              pathVisited.add(currentKey);
              space.positions.push(currentPos);
              space.length++;

              // Check adjacent positions
              const adjacent = this.getAdjacentPositions(currentPos);
              for (const adjPos of adjacent) {
                if (this.isEmptyPosition(adjPos)) {
                  if (dfs(adjPos)) return true;
                } else if (this.grid[adjPos.row][adjPos.col] !== "") {
                  space.connectedLetters.push({
                    pos: adjPos,
                    letter: this.grid[adjPos.row][adjPos.col],
                  });
                }
              }

              if (space.length === targetLength) return true;

              pathVisited.delete(currentKey);
              space.positions.pop();
              space.length--;
              return false;
            };

            if (dfs(pos)) {
              // Mark all positions in this space as visited
              space.positions.forEach((p) =>
                visited.add(this.positionToKey(p))
              );
              spaces.push(space);
              break; // Found a valid space starting at this position
            }
          }
        }
      }
    }

    // Sort spaces by size (prefer larger spaces first)
    spaces.sort((a, b) => b.length - a.length);

    return spaces;
  }

  private findWordForSpace(
    space: GridSpace,
    words: string[]
  ): [string, Position[]] | null {
    // Filter words by length and connected letters
    const candidates = words.filter((word) => {
      if (word.length !== space.length) return false;

      // Check if word contains all connected letters at correct positions
      for (const { letter } of space.connectedLetters) {
        if (!word.includes(letter)) return false;
      }
      return true;
    });

    console.log(
      `      Found ${candidates.length} candidate words for space of length ${space.length}`
    );
    if (candidates.length > 0) {
      console.log(`      Candidates: ${candidates.join(", ")}`);
    }

    // Try to place each candidate word
    for (const word of candidates) {
      // Try each position as a starting point
      for (const startPos of space.positions) {
        const path = this.findSnakePath(word, startPos);
        if (path && path.length === word.length) {
          return [word, path];
        }
      }
    }

    return null;
  }

  private placeWord(word: string, path: Position[]): void {
    for (let i = 0; i < path.length; i++) {
      const pos = path[i];
      const posKey = this.positionToKey(pos);

      // Only mark position as used if it wasn't already used (intersection)
      if (this.grid[pos.row][pos.col] === "") {
        this.usedPositions.add(posKey);
      }

      this.grid[pos.row][pos.col] = word[i];
    }
  }

  private isIsolatedSpace(pos: Position): boolean {
    // Check if this empty space is isolated (surrounded by used positions or boundaries)
    if (!this.isEmptyPosition(pos)) return false;

    const adjacent = this.getAdjacentPositions(pos);
    return adjacent.length === 0;
  }

  private evaluatePlacement(path: Position[]): number {
    // Score the placement based on:
    // 1. Number of isolated spaces created
    // 2. Connectivity to existing letters
    // 3. Space utilization
    let score = 0;

    // Check for isolated spaces created
    const isolatedSpaces = new Set<string>();
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const pos = { row, col };
        if (this.isIsolatedSpace(pos)) {
          isolatedSpaces.add(this.positionToKey(pos));
        }
      }
    }

    // Heavily penalize isolated spaces
    score -= isolatedSpaces.size * 10;

    // Reward connections to existing letters
    for (const pos of path) {
      const adjacent = this.getAdjacentPositions(pos);
      for (const adj of adjacent) {
        if (this.grid[adj.row][adj.col] !== "") {
          score += 2;
        }
      }
    }

    return score;
  }

  tryPlaceWordSnake(word: string): WordPlacement | null {
    console.log(`    Trying to place word ${word} in snake pattern`);

    // Generate all possible positions
    const allPositions: Position[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        allPositions.push({ row, col });
      }
    }

    // Calculate current bounds of placed letters
    let minRow = this.rows,
      maxRow = 0,
      minCol = this.cols,
      maxCol = 0;
    let hasLetters = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== "") {
          hasLetters = true;
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }

    // If no letters placed yet, start from center
    if (!hasLetters) {
      const centerPos = {
        row: Math.floor(this.rows / 2),
        col: Math.floor(this.cols / 2),
      };
      const path = this.findSnakePath(word, centerPos);
      if (path) {
        this.placeWord(word, path);
        return {
          word,
          startPosition: centerPos,
          direction: "snake",
          path,
        };
      }
    } else {
      // Sort positions by their proximity to the current rectangle of letters
      allPositions.sort((a, b) => {
        const aDistToRect = Math.min(
          Math.abs(a.row - minRow),
          Math.abs(a.row - maxRow),
          Math.abs(a.col - minCol),
          Math.abs(a.col - maxCol)
        );
        const bDistToRect = Math.min(
          Math.abs(b.row - minRow),
          Math.abs(b.row - maxRow),
          Math.abs(b.col - minCol),
          Math.abs(b.col - maxCol)
        );
        if (aDistToRect !== bDistToRect) return aDistToRect - bDistToRect;

        // Tiebreak by number of neighbors
        const aNeighbors = this.countOccupiedNeighbors(a);
        const bNeighbors = this.countOccupiedNeighbors(b);
        return bNeighbors - aNeighbors;
      });

      // Try each position
      for (const startPos of allPositions) {
        const path = this.findSnakePath(word, startPos);
        if (path) {
          this.placeWord(word, path);
          return {
            word,
            startPosition: startPos,
            direction: "snake",
            path,
          };
        }
      }
    }

    console.log(`    Failed to place word ${word} in any position`);
    return null;
  }

  findAndPlaceWords(words: string[]): WordPlacement[] {
    const placements: WordPlacement[] = [];
    let availableWords = [...words];
    let iteration = 1;

    while (true) {
      // Find all available spaces in the grid
      const spaces = this.findAvailableSpaces();
      if (spaces.length === 0) {
        console.log("    No more available spaces");
        break;
      }

      // Calculate total available space
      const totalAvailableSpace = spaces.reduce(
        (sum, space) => sum + space.length,
        0
      );
      console.log(`\n    Iteration ${iteration++}`);
      console.log(`    Total available space: ${totalAvailableSpace} cells`);

      // Select a combination of words that could fill the space
      const selectedWords: string[] = [];
      let remainingSpace = totalAvailableSpace;
      const wordsByLength: { [key: number]: string[] } = {};

      // Group available words by length
      availableWords.forEach((word) => {
        if (!wordsByLength[word.length]) {
          wordsByLength[word.length] = [];
        }
        wordsByLength[word.length].push(word);
      });

      // Sort lengths from longest to shortest
      const lengths = Object.keys(wordsByLength)
        .map(Number)
        .sort((a, b) => b - a);

      console.log("    Available word lengths:", lengths.join(", "));

      // Try to fill space with words
      while (remainingSpace >= 4) {
        // Minimum word length is 4
        // Find the longest word that fits in remaining space
        const wordLength = lengths.find((len) => len <= remainingSpace);

        if (!wordLength) {
          console.log(
            `    Cannot find words to fit remaining ${remainingSpace} spaces`
          );
          break;
        }

        // Select a random word of this length
        const wordsOfLength = wordsByLength[wordLength];
        if (wordsOfLength && wordsOfLength.length > 0) {
          const randomIndex = Math.floor(Math.random() * wordsOfLength.length);
          const selectedWord = wordsOfLength[randomIndex];
          selectedWords.push(selectedWord);
          remainingSpace -= wordLength;

          // Remove selected word from available words
          const index = wordsOfLength.indexOf(selectedWord);
          wordsOfLength.splice(index, 1);
          if (wordsOfLength.length === 0) {
            // Remove this length if no more words available
            lengths.splice(lengths.indexOf(wordLength), 1);
          }
        } else {
          // No more words of this length, remove it from lengths
          lengths.splice(lengths.indexOf(wordLength), 1);
        }
      }

      console.log(
        `    Selected ${selectedWords.length} words to try placing:`,
        selectedWords.join(", ")
      );

      // Now try to place each selected word
      let placedAnyWord = false;
      for (const word of selectedWords) {
        // Try each space that's big enough for this word
        const suitableSpaces = spaces.filter(
          (space) => space.length >= word.length
        );

        for (const space of suitableSpaces) {
          const result = this.findWordForSpace(space, [word]);
          if (result) {
            const [placedWord, path] = result;
            this.placeWord(placedWord, path);
            placements.push({
              word: placedWord,
              startPosition: path[0],
              direction: "snake",
              path,
            });

            // Remove the word from available words
            availableWords = availableWords.filter((w) => w !== placedWord);

            console.log(`    Placed word: ${placedWord}`);
            console.log("    Current grid:");
            console.log(this.grid.map((row) => row.join(" ")).join("\n"));
            placedAnyWord = true;
            break; // Move to next word
          }
        }
      }

      if (!placedAnyWord) {
        console.log(
          "    Could not place any more words in the available spaces"
        );
        break;
      }
    }

    return placements;
  }

  getGrid(): string[][] {
    return this.grid;
  }

  isFullyUtilized(): boolean {
    return this.usedPositions.size === this.rows * this.cols;
  }

  getUsedCellCount(): number {
    return this.usedPositions.size;
  }
}
