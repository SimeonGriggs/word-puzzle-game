import { useState } from "react";

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

export const createInitialGrid = (): Cell[][] => [
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

const WordPuzzle = () => {
  const [grid, setGrid] = useState<Cell[][]>(createInitialGrid());
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);

  const theme = "The munchies";

  const resetGame = () => {
    setGrid(createInitialGrid());
    setSelectedCells([]);
    setFoundWords([]);
  };

  const handleCellClick = (row: number, col: number) => {
    // If this cell is already selected, check if we've completed a word
    if (selectedCells.some((cell) => cell.row === row && cell.col === col)) {
      const selectedWord = selectedCells
        .map((pos) => grid[pos.row][pos.col].letter)
        .join("");

      if (
        !foundWords.some((fw) => fw.word === selectedWord) &&
        selectedWord.length >= 3
      ) {
        // Add to found words and highlight
        setFoundWords([
          ...foundWords,
          { word: selectedWord, cells: [...selectedCells] },
        ]);

        // Update grid with new highlights
        const newGrid = grid.map((row) =>
          row.map((cell) => ({
            ...cell,
            isSelected: false,
            isHighlighted:
              foundWords.some((fw) =>
                fw.cells.some(
                  (pos) => pos.row === cell.row && pos.col === cell.col
                )
              ) ||
              selectedCells.some(
                (pos) => pos.row === cell.row && pos.col === cell.col
              ),
          }))
        );
        setGrid(newGrid);
      } else {
        // Clear only current selection
        const newGrid = grid.map((row) =>
          row.map((cell) => ({
            ...cell,
            isSelected: false,
            isHighlighted: foundWords.some((fw) =>
              fw.cells.some(
                (pos) => pos.row === cell.row && pos.col === cell.col
              )
            ),
          }))
        );
        setGrid(newGrid);
      }
      setSelectedCells([]);
      return;
    }

    // Check if this is a valid next letter
    if (selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      const isAdjacent =
        Math.abs(row - lastCell.row) <= 1 && Math.abs(col - lastCell.col) <= 1;

      if (!isAdjacent) {
        // If not adjacent, start new selection
        const newGrid = grid.map((r) =>
          r.map((cell) => ({ ...cell, isSelected: false }))
        );
        newGrid[row][col].isSelected = true;
        setGrid(newGrid);
        setSelectedCells([{ row, col }]);
        return;
      }
    }

    // Add the new cell to selection
    const newGrid = [...grid];
    newGrid[row][col].isSelected = true;
    setGrid(newGrid);
    setSelectedCells([...selectedCells, { row, col }]);
  };

  const getLineStyle = (fromCell: Cell, toCell: Position) => {
    const dx = toCell.col - fromCell.col;
    const dy = toCell.row - fromCell.row;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy) * 40;

    return {
      transform: `rotate(${angle}deg)`,
      width: `${length}px`,
      left: "50%",
      top: "50%",
    };
  };

  // Get connecting lines for a cell
  const getConnectingLines = (cell: Cell) => {
    if (cell.isSelected) {
      const idx = selectedCells.findIndex(
        (pos) => pos.row === cell.row && pos.col === cell.col
      );
      if (idx >= 0 && idx < selectedCells.length - 1) {
        return (
          <div
            className="absolute h-1 bg-yellow-300 origin-left -z-10"
            style={getLineStyle(cell, selectedCells[idx + 1])}
          />
        );
      }
    }

    if (cell.isHighlighted) {
      for (const word of foundWords) {
        const idx = word.cells.findIndex(
          (pos) => pos.row === cell.row && pos.col === cell.col
        );
        if (idx >= 0 && idx < word.cells.length - 1) {
          return (
            <div
              className="absolute h-1 bg-yellow-300 origin-left -z-10"
              style={getLineStyle(cell, word.cells[idx + 1])}
            />
          );
        }
      }
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center p-5 max-w-2xl mx-auto">
      <div className="text-center mb-8 w-full">
        <h2 className="text-gray-600 text-lg uppercase mb-2">TODAY'S THEME</h2>
        <h3 className="text-2xl mb-4">{theme}</h3>
        <div className="text-4xl font-bold text-blue-500 mb-8 h-14 flex items-center justify-center">
          {selectedCells.length > 0
            ? selectedCells.map((pos) => grid[pos.row][pos.col].letter).join("")
            : ""}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-8 select-none relative">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                text-lg font-bold cursor-pointer transition-all duration-200
                border border-gray-200
                ${
                  cell.isSelected
                    ? "bg-yellow-300 scale-110"
                    : cell.isHighlighted
                    ? "bg-yellow-300"
                    : "bg-white hover:bg-gray-50"
                }
              `}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              role="button"
            >
              {getConnectingLines(cell)}
              {cell.letter}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-4">
        <button
          className="px-6 py-3 text-base border-2 border-gray-200 rounded-full
                     hover:bg-gray-50 transition-colors duration-200"
          onClick={() =>
            console.log(
              "Found words:",
              foundWords.map((fw) => fw.word)
            )
          }
        >
          View Results
        </button>

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
