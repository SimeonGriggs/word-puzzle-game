import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WordPuzzle from "./WordPuzzle";

describe("WordPuzzle", () => {
  const setup = () => {
    const user = userEvent.setup();
    render(<WordPuzzle />);
    const gameBoard = screen.getByTestId("game-board");
    const buttons = gameBoard.querySelectorAll("button");
    if (buttons.length === 0) throw new Error("No buttons found in game board");
    return { user, buttons };
  };

  it("highlights a letter when clicked", async () => {
    const { user, buttons } = setup();
    const firstCell = buttons[0];

    await user.click(firstCell);

    expect(firstCell).toHaveAttribute("data-selected", "true");
  });

  it("starts a new selection when clicking non-adjacent cells", async () => {
    const { user, buttons } = setup();

    // Click first cell (0,0)
    await user.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute("data-selected", "true");

    // Click a non-adjacent cell (2,2) - should start new selection
    await user.click(buttons[14]); // 2 rows down, 2 columns right
    expect(buttons[0]).toHaveAttribute("data-selected", "false"); // First cell should be deselected
    expect(buttons[14]).toHaveAttribute("data-selected", "true"); // New cell should be selected

    // Click an adjacent cell (2,3) - should add to selection
    await user.click(buttons[15]);
    expect(buttons[14]).toHaveAttribute("data-selected", "true"); // Previous cell stays selected
    expect(buttons[15]).toHaveAttribute("data-selected", "true"); // New adjacent cell is selected
  });

  it("highlights multiple adjacent cells when clicked in sequence", async () => {
    const { user, buttons } = setup();

    // Click first cell (0,0)
    await user.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute("data-selected", "true");

    // Click adjacent cell (0,1)
    await user.click(buttons[1]);

    // Both cells should be selected
    expect(buttons[0]).toHaveAttribute("data-selected", "true");
    expect(buttons[1]).toHaveAttribute("data-selected", "true");
  });

  it("keeps valid words highlighted after submission", async () => {
    const { user, buttons } = setup();

    // C is at position (8,4)
    const buttonC = buttons[45];
    const buttonH = buttons[46];
    const buttonI = buttons[47];
    const buttonP = buttons[40];
    const buttonS = buttons[41];

    // Select the word "CHIPS" from the grid
    // Verify we're selecting the right letters before proceeding
    expect(buttonC.textContent).toBe("C");
    expect(buttonH.textContent).toBe("H");
    expect(buttonI.textContent).toBe("I");
    expect(buttonP.textContent).toBe("P");
    expect(buttonS.textContent).toBe("S");

    await user.click(buttonC);
    expect(buttonC).toHaveAttribute("data-selected", "true");

    await user.click(buttonH);
    expect(buttonH).toHaveAttribute("data-selected", "true");

    await user.click(buttonI);
    expect(buttonI).toHaveAttribute("data-selected", "true");

    await user.click(buttonP);
    expect(buttonP).toHaveAttribute("data-selected", "true");

    await user.click(buttonS);
    expect(buttonS).toHaveAttribute("data-selected", "true");

    // Submit by clicking S again
    await user.click(buttonS);

    // After submission, all cells should be highlighted but not selected
    expect(buttonC).toHaveAttribute("data-selected", "false");
    expect(buttonH).toHaveAttribute("data-selected", "false");
    expect(buttonI).toHaveAttribute("data-selected", "false");
    expect(buttonP).toHaveAttribute("data-selected", "false");
    expect(buttonS).toHaveAttribute("data-selected", "false");

    expect(buttonC).toHaveAttribute("data-highlighted", "true");
    expect(buttonH).toHaveAttribute("data-highlighted", "true");
    expect(buttonI).toHaveAttribute("data-highlighted", "true");
    expect(buttonP).toHaveAttribute("data-highlighted", "true");
    expect(buttonS).toHaveAttribute("data-highlighted", "true");
  });
});
