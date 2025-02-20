import { ChangeEvent } from "react";

interface Props {
  currentPuzzleId: string | null;
  onPuzzleSelect: (puzzleId: string) => void;
  puzzles: {
    grid: string[][];
    words: {
      word: string;
      positions: {
        row: number;
        col: number;
      }[];
    }[];
  }[];
}

const PuzzleSelector = ({
  currentPuzzleId,
  onPuzzleSelect,
  puzzles,
}: Props) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onPuzzleSelect(e.target.value);
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      <select
        value={currentPuzzleId || ""}
        onChange={handleChange}
        className="w-full p-2 border-2 border-gray-200 rounded-lg bg-white text-gray-700 text-lg"
      >
        <option value="" disabled>
          Select a puzzle...
        </option>
        {puzzles.map((puzzle, index) => (
          <option key={index} value={index.toString()}>
            Puzzle {index + 1} ({puzzle.words.length} words)
          </option>
        ))}
      </select>
    </div>
  );
};

export default PuzzleSelector;
