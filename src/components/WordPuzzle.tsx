import { useState, useEffect } from "react";

interface Cell {
  letter: string;
  isSelected: boolean;
  isHighlighted: boolean;
  row: number;
  col: number;
}

interface Position {
  row: number;
  col: number;
}

interface FoundWord {
  word: string;
  cells: Position[];
}

// Valid words for the "munchies" theme
const VALID_WORDS = new Set([
  "GRANOLA",
  "POPCORN",
  "CHEESE",
  "SNACKTIME",
  "NUTS",
  "CANDY",
  "FRUIT",
  "CHIPS",
]);

const WordPuzzle = () => {
  const createInitialGrid = (): Cell[][] => [
    [
      { letter: "N", isSelected: false, isHighlighted: false, row: 0, col: 0 },
      { letter: "O", isSelected: false, isHighlighted: false, row: 0, col: 1 },
      { letter: "A", isSelected: false, isHighlighted: false, row: 0, col: 2 },
      { letter: "M", isSelected: false, isHighlighted: false, row: 0, col: 3 },
      { letter: "E", isSelected: false, isHighlighted: false, row: 0, col: 4 },
      { letter: "U", isSelected: false, isHighlighted: false, row: 0, col: 5 },
    ],
    [
      { letter: "A", isSelected: false, isHighlighted: false, row: 1, col: 0 },
      { letter: "L", isSelected: false, isHighlighted: false, row: 1, col: 1 },
      { letter: "I", isSelected: false, isHighlighted: false, row: 1, col: 2 },
      { letter: "S", isSelected: false, isHighlighted: false, row: 1, col: 3 },
      { letter: "T", isSelected: false, isHighlighted: false, row: 1, col: 4 },
      { letter: "N", isSelected: false, isHighlighted: false, row: 1, col: 5 },
    ],
    [
      { letter: "O", isSelected: false, isHighlighted: false, row: 2, col: 0 },
      { letter: "R", isSelected: false, isHighlighted: false, row: 2, col: 1 },
      { letter: "G", isSelected: false, isHighlighted: false, row: 2, col: 2 },
      { letter: "T", isSelected: false, isHighlighted: false, row: 2, col: 3 },
      { letter: "C", isSelected: false, isHighlighted: false, row: 2, col: 4 },
      { letter: "A", isSelected: false, isHighlighted: false, row: 2, col: 5 },
    ],
    [
      { letter: "C", isSelected: false, isHighlighted: false, row: 3, col: 0 },
      { letter: "R", isSelected: false, isHighlighted: false, row: 3, col: 1 },
      { letter: "K", isSelected: false, isHighlighted: false, row: 3, col: 2 },
      { letter: "Y", isSelected: false, isHighlighted: false, row: 3, col: 3 },
      { letter: "D", isSelected: false, isHighlighted: false, row: 3, col: 4 },
      { letter: "N", isSelected: false, isHighlighted: false, row: 3, col: 5 },
    ],
    [
      { letter: "E", isSelected: false, isHighlighted: false, row: 4, col: 0 },
      { letter: "P", isSelected: false, isHighlighted: false, row: 4, col: 1 },
      { letter: "N", isSelected: false, isHighlighted: false, row: 4, col: 2 },
      { letter: "C", isSelected: false, isHighlighted: false, row: 4, col: 3 },
      { letter: "T", isSelected: false, isHighlighted: false, row: 4, col: 4 },
      { letter: "I", isSelected: false, isHighlighted: false, row: 4, col: 5 },
    ],
    [
      { letter: "S", isSelected: false, isHighlighted: false, row: 5, col: 0 },
      { letter: "O", isSelected: false, isHighlighted: false, row: 5, col: 1 },
      { letter: "A", isSelected: false, isHighlighted: false, row: 5, col: 2 },
      { letter: "F", isSelected: false, isHighlighted: false, row: 5, col: 3 },
      { letter: "R", isSelected: false, isHighlighted: false, row: 5, col: 4 },
      { letter: "U", isSelected: false, isHighlighted: false, row: 5, col: 5 },
    ],
    [
      { letter: "E", isSelected: false, isHighlighted: false, row: 6, col: 0 },
      { letter: "E", isSelected: false, isHighlighted: false, row: 6, col: 1 },
      { letter: "P", isSelected: false, isHighlighted: false, row: 6, col: 2 },
      { letter: "N", isSelected: false, isHighlighted: false, row: 6, col: 3 },
      { letter: "P", isSelected: false, isHighlighted: false, row: 6, col: 4 },
      { letter: "S", isSelected: false, isHighlighted: false, row: 6, col: 5 },
    ],
    [
      { letter: "H", isSelected: false, isHighlighted: false, row: 7, col: 0 },
      { letter: "C", isSelected: false, isHighlighted: false, row: 7, col: 1 },
      { letter: "S", isSelected: false, isHighlighted: false, row: 7, col: 2 },
      { letter: "C", isSelected: false, isHighlighted: false, row: 7, col: 3 },
      { letter: "H", isSelected: false, isHighlighted: false, row: 7, col: 4 },
      { letter: "I", isSelected: false, isHighlighted: false, row: 7, col: 5 },
    ],
  ];

  const [grid, setGrid] = useState<Cell[][]>(createInitialGrid());
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [wordAnimation, setWordAnimation] = useState<{
    word: string;
    isError: boolean;
    isValidWord?: boolean;
    message?: string;
  } | null>(null);
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());

  const theme = "The munchies";

  // Load the dictionary when component mounts
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch("/data/enable1.txt");
        const text = await response.text();
        const words = new Set(
          text.split("\n").map((word) => word.trim().toUpperCase())
        );
        setDictionary(words);
      } catch (error) {
        console.error("Failed to load dictionary:", error);
      }
    };

    loadDictionary();
  }, []);

  // Helper function to get cell center coordinates
  const getCellCenter = (row: number, col: number) => {
    const cellSize = 40; // w-10
    const gap = 8; // gap-2
    const gridPadding = 4; // p-1

    // Calculate total position including gaps and grid padding
    const x = col * (cellSize + gap) + cellSize / 2 + gridPadding;
    const y = row * (cellSize + gap) + cellSize / 2 + gridPadding;
    return { x, y };
  };

  // Generate SVG paths for all lines
  const generatePaths = () => {
    const paths = [];

    // Draw lines for current selection
    if (selectedCells.length > 1) {
      const points = selectedCells.map((pos) =>
        getCellCenter(pos.row, pos.col)
      );
      const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
      paths.push(
        <path
          key="selection"
          d={pathD}
          stroke="#BFDBFE" // blue-200
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    // Draw lines for found words
    foundWords.forEach((word, wordIndex) => {
      const points = word.cells.map((pos) => getCellCenter(pos.row, pos.col));
      const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
      paths.push(
        <path
          key={`word-${wordIndex}`}
          d={pathD}
          stroke="#BBF7D0" // green-200
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });

    return paths;
  };

  useEffect(() => {
    if (wordAnimation) {
      const timer = setTimeout(() => {
        setWordAnimation(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [wordAnimation]);

  // Update the grid state with current selections and highlights
  const updateGridState = (
    selections: Position[] = [],
    highlights: Position[] = []
  ) => {
    setGrid(
      grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isSelected: selections.some(
            (pos) => pos.row === cell.row && pos.col === cell.col
          ),
          isHighlighted: highlights.some(
            (pos) => pos.row === cell.row && pos.col === cell.col
          ),
        }))
      )
    );
  };

  // Get all highlighted positions from found words
  const getAllHighlightedPositions = (additionalPositions: Position[] = []) => {
    const positions: Position[] = [];
    foundWords.forEach((word) => positions.push(...word.cells));
    if (additionalPositions.length > 0) {
      positions.push(...additionalPositions);
    }
    return positions;
  };

  const resetGame = () => {
    setGrid(createInitialGrid());
    setSelectedCells([]);
    setFoundWords([]);
    setWordAnimation(null);
  };

  // Handle word submission and validation
  const submitWord = (word: string, cells: Position[]) => {
    const upperWord = word.toUpperCase();

    // Validate word length
    if (word.length < 4) {
      setWordAnimation({
        word: upperWord,
        isError: true,
        isValidWord: false,
        message: "Too short",
      });
      updateGridState([], getAllHighlightedPositions());
      setSelectedCells([]);
      return;
    }

    // Check if word is already found
    const isAlreadyFound = foundWords.some(
      (fw) => fw.word.toUpperCase() === upperWord
    );

    if (isAlreadyFound) {
      setWordAnimation({
        word: upperWord,
        isError: true,
        message: "Already found",
      });
      updateGridState([], getAllHighlightedPositions());
      setSelectedCells([]);
      return;
    }

    // Check if word is in puzzle's valid words
    const isPuzzleWord = VALID_WORDS.has(upperWord);

    // Check if word is in dictionary
    const isValidWord = dictionary.has(upperWord);

    if (isPuzzleWord) {
      // Add to found words
      const newFoundWords = [...foundWords, { word: upperWord, cells }];
      setFoundWords(newFoundWords);

      // Update grid state with all highlights
      const allHighlights = getAllHighlightedPositions(cells);
      updateGridState([], allHighlights);

      // Show success animation
      setWordAnimation({ word: upperWord, isError: false });
    } else if (isValidWord) {
      // Show "valid word but not in puzzle" animation
      setWordAnimation({
        word: upperWord,
        isError: true,
        isValidWord: true,
        message: "Valid word, but not in puzzle",
      });
      updateGridState([], getAllHighlightedPositions());
    } else {
      // Show "not a valid word" animation
      setWordAnimation({
        word: upperWord,
        isError: true,
        isValidWord: false,
        message: "Not a valid word",
      });
      updateGridState([], getAllHighlightedPositions());
    }

    // Clear selections
    setSelectedCells([]);
  };

  const handleCellClick = (row: number, col: number) => {
    // If clicking the last selected cell, submit the word
    if (selectedCells.some((cell) => cell.row === row && cell.col === col)) {
      const selectedWord = selectedCells
        .map((pos) => grid[pos.row][pos.col].letter)
        .join("");
      submitWord(selectedWord, selectedCells);
      return;
    }

    // Check if this is a valid next letter
    if (selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      const isAdjacent =
        Math.abs(row - lastCell.row) <= 1 && Math.abs(col - lastCell.col) <= 1;

      if (!isAdjacent) {
        // If not adjacent, start new selection
        const newSelection = [{ row, col }];
        updateGridState(newSelection, getAllHighlightedPositions());
        setSelectedCells(newSelection);
        return;
      }
    }

    // Add the new cell to selection
    const newSelection = [...selectedCells, { row, col }];
    updateGridState(newSelection, getAllHighlightedPositions());
    setSelectedCells(newSelection);
  };

  return (
    <div className="flex flex-col items-center p-5 max-w-2xl mx-auto">
      <div className="text-center mb-8 w-full">
        <h3 className="text-2xl mb-4">{theme}</h3>
        <div className="relative h-14">
          {/* Combined word display */}
          <div
            className={`text-4xl font-bold absolute w-full flex items-center justify-center transition-all duration-200 flex-col
              ${
                wordAnimation
                  ? wordAnimation.isError
                    ? wordAnimation.isValidWord
                      ? "text-yellow-500" // Valid word but not in puzzle
                      : "text-red-500" // Not a valid word
                    : "text-green-500" // Found a puzzle word!
                  : "text-blue-300" // Current selection
              }
              ${wordAnimation?.isError ? "animate-shake" : ""}
              ${wordAnimation ? "animate-fadeOut" : ""}
            `}
          >
            {/* Show either animation word or current selection */}
            {wordAnimation ? (
              <>
                {wordAnimation.word}
                {wordAnimation.isError && wordAnimation.message && (
                  <span className="text-base">({wordAnimation.message})</span>
                )}
              </>
            ) : selectedCells.length > 0 ? (
              selectedCells.map((pos) => grid[pos.row][pos.col].letter).join("")
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      <div
        data-testid="game-board"
        className="grid grid-cols-6 gap-2 mb-8 select-none relative p-1"
      >
        {/* SVG layer for lines */}
        <svg
          className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
          viewBox="0 0 288 384"
          preserveAspectRatio="xMinYMin meet"
        >
          {generatePaths()}
        </svg>

        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`
                size-10 rounded-full flex items-center justify-center
                text-lg font-bold cursor-pointer transition-all duration-200
                border ${
                  cell.isSelected
                    ? "bg-blue-200 border-blue-200 text-blue-900 scale-110"
                    : cell.isHighlighted
                    ? "bg-green-200 border-green-200 text-green-900"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }
              `}
              data-selected={cell.isSelected.toString()}
              data-highlighted={cell.isHighlighted.toString()}
              data-position={`${rowIndex * 6 + colIndex}`}
              onClick={() => handleCellClick(cell.row, cell.col)}
            >
              {cell.letter}
            </button>
          ))
        )}
      </div>

      <div className="flex gap-4">
        <button
          className="px-6 py-3 text-base border-2 border-gray-200 rounded-full
                     hover:bg-gray-50 transition-colors duration-200"
          onClick={resetGame}
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default WordPuzzle;
