import { useState, useEffect } from "react";

interface Cell {
  letter: string;
  isSelected: boolean;
  isHighlighted: boolean;
  row: number;
  col: number;
  distanceFromCenter: number;
}

interface Position {
  row: number;
  col: number;
}

interface FoundWord {
  word: string;
  cells: Position[];
}

interface Props {
  grid: string[][];
  validWords: string[];
  solutions: {
    word: string;
    path: { row: number; col: number }[];
  }[];
}

const WordPuzzle = ({ grid, validWords, solutions }: Props) => {
  const createInitialGrid = (): Cell[][] => {
    const centerRow = 3.5;
    const centerCol = 2.5;

    return grid.map((row, rowIndex) =>
      row.map((letter, colIndex) => ({
        letter: letter || " ", // Handle empty strings in grid
        isSelected: false,
        isHighlighted: false,
        row: rowIndex,
        col: colIndex,
        distanceFromCenter: Math.sqrt(
          Math.pow(rowIndex - centerRow, 2) + Math.pow(colIndex - centerCol, 2)
        ),
      }))
    );
  };

  const [gridState, setGridState] = useState<Cell[][]>(createInitialGrid());
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [wordAnimation, setWordAnimation] = useState<{
    word: string;
    isError: boolean;
    isValidWord?: boolean;
    message?: string;
  } | null>(null);
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [showWordList, setShowWordList] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

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
    setGridState(
      gridState.map((row) =>
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

  const handleWordClick = (word: string) => {
    // If word is already highlighted, unhighlight it
    if (highlightedWord === word) {
      setHighlightedWord(null);
      updateGridState([], getAllHighlightedPositions());
      return;
    }

    // Find the solution path for this word
    const solution = solutions.find((s) => s.word === word);
    if (solution) {
      setHighlightedWord(word);
      // Highlight just this word's path
      const foundWordPaths = foundWords
        .filter((fw) => fw.word !== word)
        .flatMap((fw) => fw.cells);
      updateGridState([], [...foundWordPaths, ...solution.path]);
    }
  };

  // Get all highlighted positions from found words
  const getAllHighlightedPositions = (additionalPositions: Position[] = []) => {
    const positions: Position[] = [];
    foundWords.forEach((word) => positions.push(...word.cells));
    if (additionalPositions.length > 0) {
      positions.push(...additionalPositions);
    }
    // Add currently highlighted word path
    if (highlightedWord) {
      const solution = solutions.find((s) => s.word === highlightedWord);
      if (solution) {
        positions.push(...solution.path);
      }
    }
    return positions;
  };

  const resetGame = () => {
    setGridState(createInitialGrid());
    setSelectedCells([]);
    setFoundWords([]);
    setWordAnimation(null);
    setIsPuzzleSolved(false);
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
    const isPuzzleWord = validWords.includes(upperWord);

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
    // Skip empty cells
    if (!gridState[row][col].letter.trim()) {
      return;
    }

    // If clicking the last selected cell, submit the word
    if (selectedCells.some((cell) => cell.row === row && cell.col === col)) {
      const selectedWord = selectedCells
        .map((pos) => gridState[pos.row][pos.col].letter)
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

  useEffect(() => {
    // Check if all valid words have been found
    if (foundWords.length === validWords.length) {
      setIsPuzzleSolved(true);
    }
  }, [foundWords, validWords]);

  return (
    <div className="max-w-4xl flex flex-col items-center mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-full">
          <div className="text-center mb-8 w-full">
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
                      <span className="text-base">
                        ({wordAnimation.message})
                      </span>
                    )}
                  </>
                ) : selectedCells.length > 0 ? (
                  selectedCells
                    .map((pos) => gridState[pos.row][pos.col].letter)
                    .join("")
                ) : (
                  ""
                )}
              </div>
            </div>
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

        {gridState.map((row, rowIndex) =>
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
                ${isPuzzleSolved ? "animate-victory-pulse" : ""}
              `}
              style={
                isPuzzleSolved
                  ? {
                      animationDelay: `${cell.distanceFromCenter * 100}ms`,
                    }
                  : undefined
              }
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
        <button
          className="px-6 py-3 text-base border-2 border-blue-200 text-blue-600 rounded-full
                     hover:bg-blue-50 transition-colors duration-200"
          onClick={() => {
            // Reset game and show solution paths
            resetGame();
            const solutionWords = solutions.map((solution) => ({
              word: solution.word,
              cells: solution.path,
            }));
            setFoundWords(solutionWords);

            // Update grid state to highlight all solution cells
            const allSolutionCells = solutions.flatMap(
              (solution) => solution.path
            );
            updateGridState([], allSolutionCells);

            setIsPuzzleSolved(true);
          }}
        >
          Solve
        </button>
        <button
          className="px-6 py-3 text-base border-2 border-purple-200 text-purple-600 rounded-full
                     hover:bg-purple-50 transition-colors duration-200"
          onClick={() => setShowWordList(!showWordList)}
        >
          {showWordList ? "Hide Words" : "Show Words"}
        </button>
      </div>

      {showWordList && (
        <div className="mt-8 p-4 border-2 border-purple-100 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Valid Words:</h4>
          <div className="grid grid-cols-3 gap-2">
            {validWords.map((word, index) => (
              <button
                key={index}
                onClick={() => handleWordClick(word)}
                className={`p-2 rounded transition-all duration-200 text-left
                  ${
                    foundWords.some((fw) => fw.word === word)
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }
                  ${highlightedWord === word ? "ring-2 ring-blue-400" : ""}
                `}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPuzzle;
