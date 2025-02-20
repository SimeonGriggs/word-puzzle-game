# Word Puzzle Game

A modern, interactive word search puzzle game built with React and TypeScript. Players search for themed words by connecting adjacent letters in any direction (horizontal, vertical, or diagonal).

## Features

- **Theme-Based Puzzles**: Currently featuring "The Munchies" theme with food-related words
- **Interactive Grid**:

  - Click and drag through letters to form words
  - Visual feedback with color-coded selections and highlights
  - Smooth animations and transitions
  - SVG lines showing word connections

- **Smart Word Validation**:

  - Validates against puzzle-specific word list
  - Checks against ENABLE dictionary for valid English words
  - Provides helpful feedback messages:
    - Success for finding puzzle words
    - Notification for valid English words not in the puzzle
    - Error messages for invalid or too-short words (minimum 4 letters)
    - Prevents duplicate word submissions

- **Modern UI**:
  - Clean, responsive design
  - Color-coded feedback system
  - Animated word submissions and error messages
  - Reset functionality to start fresh

## Technical Details

- Built with React and TypeScript
- Styled with Tailwind CSS
- Uses ENABLE dictionary for word validation
- SVG-based line drawing for word connections
- Responsive and accessible design

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## How to Play

1. Find words by clicking and dragging through adjacent letters
2. Words can be formed in any direction (horizontal, vertical, or diagonal)
3. Words must be at least 4 letters long
4. Click the last letter again to submit a word
5. Found words will be highlighted in green
6. Use the Reset button to start a new game

## Word List

Current puzzle includes these snack-themed words:

- GRANOLA
- POPCORN
- CHEESE
- SNACKTIME
- NUTS
- CANDY
- FRUIT
- CHIPS

## Future Enhancements

- Multiple themes and puzzles
- Difficulty levels
- Score tracking
- Timer functionality
- Mobile touch support
- More visual feedback and animations

## License

MIT License - feel free to use and modify as needed.
