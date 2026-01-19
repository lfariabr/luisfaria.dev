// npm test -- --testPathPattern="Apod.test" --no-coverage

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { ApodFab } from "@/components/apod/ApodFab";
import { GET_TODAYS_APOD } from "@/lib/graphql/queries/apod.queries";

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

const mockApodData = {
  getTodaysApod: {
    date: "2026-01-19",
    title: "Test Galaxy Image",
    explanation: "A beautiful galaxy captured by Hubble.",
    url: "https://apod.nasa.gov/apod/image/test.jpg",
    mediaType: "image",
    serviceVersion: "v1",
    hdurl: "https://apod.nasa.gov/apod/image/test_hd.jpg",
    copyright: "NASA",
    apodUrl: "https://apod.nasa.gov/apod/ap260119.html",
  },
};

const mocks: MockedResponse[] = [
  {
    request: { query: GET_TODAYS_APOD },
    result: { data: mockApodData },
    maxUsageCount: 2, // cache-and-network can trigger multiple fetches
  },
];

const renderWithApollo = (ui: React.ReactElement, customMocks = mocks) => {
  return render(
    <MockedProvider mocks={customMocks} addTypename={false}>
      {ui}
    </MockedProvider>
  );
};

describe("ApodFab", () => {
  it("renders the APOD button with an accessible name", () => {
    renderWithApollo(<ApodFab />);
    expect(
      screen.getByRole("button", { name: /astronomy picture of the day/i })
    ).toBeInTheDocument();
  });

  it("renders the APOD image", () => {
    renderWithApollo(<ApodFab />);
    expect(screen.getByAltText(/nasa apod/i)).toBeInTheDocument();
  });

  it("opens dialog on click", async () => {
    const user = userEvent.setup();
    renderWithApollo(<ApodFab />);

    await user.click(screen.getByRole("button", { name: /astronomy picture of the day/i }));

    // Dialog should now be visible
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    
    // Dialog content should include NASA branding
    expect(screen.getByText(/powered by nasa/i)).toBeInTheDocument();
  });

  it("shows loading state when dialog opens", async () => {
    // Use a delayed mock to ensure we can observe the loading state
    const delayedMocks: MockedResponse[] = [
      {
        request: { query: GET_TODAYS_APOD },
        result: { data: mockApodData },
        delay: 100, // Delay response to observe loading state
        maxUsageCount: 2,
      },
    ];

    const user = userEvent.setup();
    renderWithApollo(<ApodFab />, delayedMocks);

    await user.click(screen.getByRole("button", { name: /astronomy picture of the day/i }));

    // Dialog opens
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    
    // Scope assertions to dialog content only
    const dialogContent = within(dialog);
    
    // Check for loading indicators inside the dialog (multiple loading texts present)
    const loadingElements = dialogContent.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
    
    // Verify the mock data title is NOT present yet (still loading)
    expect(dialogContent.queryByText(/Test Galaxy Image/i)).not.toBeInTheDocument();
  });

  it("renders tooltip on hover", async () => {
    const user = userEvent.setup();
    renderWithApollo(<ApodFab />);

    const button = screen.getByRole("button", { name: /astronomy picture of the day/i });
    await user.hover(button);

    // Tooltip should appear (may need waitFor due to animation)
    expect(
      await screen.findByRole("tooltip", { name: /nasa apod/i })
    ).toBeInTheDocument();
  });

  it("handles error state", async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: { query: GET_TODAYS_APOD },
        error: new Error("Failed to fetch APOD"),
      },
    ];

    const user = userEvent.setup();
    renderWithApollo(<ApodFab />, errorMocks);

    await user.click(screen.getByRole("button", { name: /astronomy picture of the day/i }));

    // Error state should show retry button
    await waitFor(() => {
      expect(screen.getByText(/failed to load apod/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});