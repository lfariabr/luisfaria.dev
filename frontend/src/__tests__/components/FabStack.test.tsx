import React from "react";
import { render, screen } from "@testing-library/react";
import { FabStack } from "@/components/layouts/FabStack";

describe("FabStack", () => {
  it("pins a single column to the bottom-right corner", () => {
    render(
      <FabStack>
        <button>Support</button>
      </FabStack>
    );

    const stack = screen.getByTestId("fab-stack");
    expect(stack).toHaveClass("fixed", "bottom-6", "right-6", "flex", "flex-col");
  });

  it("renders FABs in order so the last child sits in the corner", () => {
    render(
      <FabStack>
        <button>Goggins</button>
        <button>Support</button>
      </FabStack>
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Goggins", "Support"]);
  });
});
