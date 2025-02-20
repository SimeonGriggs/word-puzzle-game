import { dictionaryTheme } from "./themes/dictionary";
import fs from "fs";
import path from "path";
import GridGenerator from "./grid-generator";

const generator = new GridGenerator();

console.log("Generating puzzles using dictionary words...");
console.log(`Total available words: ${dictionaryTheme.words.length}`);

const puzzle = generator.generate();
if (!puzzle) {
  console.error("Failed to generate puzzles");
  process.exit(1);
}
console.log(`Successfully generated puzzle`);

// Ensure output directory exists
const outputDir = path.join(
  path.join(process.cwd(), ".."),
  "public",
  "puzzles"
);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save puzzles to file
const outputPath = path.join(outputDir, "dictionary.json");
fs.writeFileSync(outputPath, JSON.stringify(puzzle, null, 2));
console.log(`Saved puzzles to ${outputPath}`);

// Print puzzle details
puzzle.grid.forEach((row) => console.log(row.join(" ")));
