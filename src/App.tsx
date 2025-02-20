import { useState, useEffect } from "react";
import "./App.css";
import WordPuzzle from "./components/WordPuzzle";
import PuzzleSelector from "./components/PuzzleSelector";

interface PuzzleData {
  grid: string[][];
  words: {
    word: string;
    positions: {
      row: number;
      col: number;
    }[];
  }[];
}

function App() {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/puzzles/dictionary.json`);
        if (!response.ok) {
          throw new Error(`Failed to load puzzles`);
        }
        const fetchedPuzzle = await response.json();
        const fetchedPuzzlesArray = [fetchedPuzzle];
        setPuzzles(fetchedPuzzlesArray);

        // Select the first puzzle by default
        if (fetchedPuzzlesArray.length > 0 && !selectedPuzzleId) {
          setSelectedPuzzleId("0");
        }
      } catch (err) {
        console.error("Failed to load puzzles:", err);
        setError("Failed to load puzzles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadPuzzles();
  }, []);

  const selectedPuzzle = puzzles[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading puzzles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="app min-h-screen py-8 px-4">
      <PuzzleSelector
        currentPuzzleId={selectedPuzzleId}
        onPuzzleSelect={setSelectedPuzzleId}
        puzzles={puzzles}
      />
      {selectedPuzzle && (
        <WordPuzzle
          grid={selectedPuzzle.grid}
          validWords={selectedPuzzle.words.map(({ word }) => word)}
          solutions={selectedPuzzle.words.map(({ word, positions }) => ({
            word,
            path: positions,
          }))}
        />
      )}
    </div>
  );
}

export default App;
