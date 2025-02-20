import { useState } from "react";
import "./App.css";
import WordPuzzle from "./components/WordPuzzle";
import { usePuzzleGenerator } from "./hooks/usePuzzleGenerator";

function App() {
  const { puzzleData, generateNewPuzzle } = usePuzzleGenerator();
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = () => {
    setError(null);
    const success = generateNewPuzzle();
    if (!success) {
      setError("Failed to generate puzzle. Please try again.");
    }
  };

  return (
    <div className="app min-h-screen py-8 px-4">
      <div className="flex justify-center mb-8">
        <button
          onClick={handleGenerateClick}
          className="px-6 py-3 text-base border-2 border-blue-200 text-blue-600 rounded-full
                     hover:bg-blue-50 transition-colors duration-200"
        >
          Generate New Puzzle
        </button>
      </div>

      {error && (
        <div className="text-center mb-8">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      )}

      {puzzleData && (
        <WordPuzzle
          grid={puzzleData.grid}
          validWords={puzzleData.validWords}
          solutions={puzzleData.solutions}
          theme={puzzleData.theme}
        />
      )}
    </div>
  );
}

export default App;
