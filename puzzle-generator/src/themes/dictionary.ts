import { Theme } from "../types";
import fs from "fs";
import path from "path";

function loadDictionaryWords(): string[] {
  // Go up two directories from current file to reach project root
  const filePath = path.join(__dirname, "../../../public/data/enable1.txt");
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((word) => word.trim().toUpperCase())
    .filter((word) => {
      // Filter criteria:
      // 1. Word length between 4 and 8 characters (good for puzzle size)
      // 2. Only letters A-Z (no special characters)
      return word.length >= 4 && word.length <= 8 && /^[A-Z]+$/.test(word);
    });
}

export const dictionaryTheme: Theme = {
  name: "Dictionary Words",
  description: "Words from the English dictionary",
  words: loadDictionaryWords(),
};
