import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StripeFab } from "@/components/stripe/StripeFab";

const mockStartCheckout = jest.fn();
const mockTrackClientEvent = jest.fn();
const mockToastError = jest.fn();

let mockLoading = false;

jest.mock("@/lib/hooks/useStripeCheckout", () => ({
  useStripeCheckout: () => ({
    startCheckout: (...args: unknown[]) => mockStartCheckout(...args),
    loading: mockLoading,
  }),
}));

jest.mock("@/utils/analytics", () => ({
  trackClientEvent: (...args: unknown[]) => mockTrackClientEvent(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("StripeFab", () => {
  beforeEach(() => {
    mockLoading = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders support checkout button", () => {
    render(<StripeFab />);
    expect(
      screen.getByRole("button", { name: /open support checkout options/i })
    ).toBeInTheDocument();
  });

  it("opens dialog and starts checkout after selecting item", async () => {
    const user = userEvent.setup();
    mockStartCheckout.mockResolvedValue({ ok: true });
    render(<StripeFab />);

    await user.click(
      screen.getByRole("button", { name: /open support checkout options/i })
    );

    expect(
      screen.getByText(/choose one option and continue to stripe secure checkout/i)
    ).toBeInTheDocument();

    const continueButton = screen.getByRole("button", {
      name: /continue to secure checkout/i,
    });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /buy me a coffee/i }));
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(mockStartCheckout).toHaveBeenCalledWith("coffee", "");
    expect(mockTrackClientEvent).toHaveBeenCalledWith("stripe_fab_opened");
    expect(mockTrackClientEvent).toHaveBeenCalledWith("stripe_item_selected", {
      productKey: "coffee",
    });
  });

  it("rejects invalid email before starting checkout", async () => {
    const user = userEvent.setup();
    render(<StripeFab />);

    await user.click(
      screen.getByRole("button", { name: /open support checkout options/i })
    );
    await user.click(screen.getByRole("button", { name: /buy me a coffee/i }));
    await user.type(screen.getByLabelText(/email \(optional\)/i), "bad-email");
    await user.click(screen.getByRole("button", { name: /continue to secure checkout/i }));

    expect(mockStartCheckout).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      "Enter a valid email or leave the field blank."
    );
  });

  it("selects meeting product and calls startCheckout with 'meeting'", async () => {
    const user = userEvent.setup();
    mockStartCheckout.mockResolvedValue({ ok: true });
    render(<StripeFab />);

    await user.click(
      screen.getByRole("button", { name: /open support checkout options/i })
    );
    await user.click(screen.getByRole("button", { name: /book a meeting/i }));

    const continueButton = screen.getByRole("button", {
      name: /continue to secure checkout/i,
    });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(mockStartCheckout).toHaveBeenCalledWith("meeting", "");
    expect(mockTrackClientEvent).toHaveBeenCalledWith("stripe_item_selected", {
      productKey: "meeting",
    });
  });

  it("shows error alert when checkout fails", async () => {
    const user = userEvent.setup();
    mockStartCheckout.mockResolvedValue({
      ok: false,
      errorMessage: "Service unavailable",
    });
    render(<StripeFab />);

    await user.click(
      screen.getByRole("button", { name: /open support checkout options/i })
    );
    await user.click(screen.getByRole("button", { name: /buy me a coffee/i }));
    await user.click(
      screen.getByRole("button", { name: /continue to secure checkout/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
    });
  });

  it("disables continue button when loading", async () => {
    const user = userEvent.setup();
    mockLoading = true;
    render(<StripeFab />);

    await user.click(
      screen.getByRole("button", { name: /open support checkout options/i })
    );
    await user.click(screen.getByRole("button", { name: /buy me a coffee/i }));

    const continueButton = screen.getByRole("button", {
      name: /redirecting/i,
    });
    expect(continueButton).toBeDisabled();
  });
});
