// npm test -- --testPathPattern="Apod.test" --no-coverage

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApodFab } from "@/components/apod/ApodFab";

jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt} />;
});

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));

describe("ApodFab", () => {
  it("renders the APOD button with an accessible name", () => {
    render(<ApodFab />);
    expect(
      screen.getByRole("button", { name: /astronomy picture of the day/i })
    ).toBeInTheDocument();
  });

  it("renders the APOD image", () => {
    render(<ApodFab />);
    expect(screen.getByAltText(/nasa apod/i)).toBeInTheDocument();
  });

  it("opens dialog on click", async () => {
    const user = userEvent.setup();
    render(<ApodFab />);

    await user.click(screen.getByRole("button", { name: /astronomy picture of the day/i }));

    // Dialog should now be visible
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    
    // Dialog content should include NASA branding
    expect(screen.getByText(/powered by nasa/i)).toBeInTheDocument();
  });

  it("renders tooltip on hover", async () => {
    const user = userEvent.setup();
    render(<ApodFab />);

    const button = screen.getByRole("button", { name: /astronomy picture of the day/i });
    await user.hover(button);

    // Tooltip should appear (may need waitFor due to animation)
    expect(
      await screen.findByRole("tooltip", { name: /nasa apod/i })
    ).toBeInTheDocument();
  });
});