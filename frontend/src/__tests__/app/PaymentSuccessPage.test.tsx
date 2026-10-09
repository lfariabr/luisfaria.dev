import React from "react";
import { render, screen } from "@testing-library/react";
import PaymentSuccessPage from "@/app/payment/success/page";

const mockFetchGql = jest.fn();

jest.mock("@/lib/graphql/fetchGql", () => ({
  fetchGql: (...args: unknown[]) => mockFetchGql(...args),
}));

jest.mock("@/components/layouts/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("PaymentSuccessPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders success copy for a paid Stripe session", async () => {
    mockFetchGql.mockResolvedValue({
      checkoutSessionStatus: {
        sessionId: "cs_paid",
        paymentStatus: "paid",
        status: "complete",
      },
    });

    const page = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: "cs_paid" }),
    });

    render(page);

    expect(screen.getByText(/payment complete/i)).toBeInTheDocument();
    expect(screen.getByText(/thank you for your support/i)).toBeInTheDocument();
  });

  describe("booking link", () => {
    const renderWith = async (checkoutSessionStatus: Record<string, unknown>) => {
      mockFetchGql.mockResolvedValue({ checkoutSessionStatus });
      const page = await PaymentSuccessPage({
        searchParams: Promise.resolve({ session_id: "cs_meeting" }),
      });
      render(page);
    };

    it("shows Book your session for a paid meeting", async () => {
      await renderWith({
        sessionId: "cs_meeting",
        paymentStatus: "paid",
        status: "complete",
        productKey: "meeting",
        bookingUrl: "https://cal.com/lfariadev/consulting-session",
      });

      const link = screen.getByRole("link", { name: /book your session/i });
      expect(link).toHaveAttribute("href", "https://cal.com/lfariadev/consulting-session");
      expect(screen.getByText(/booking link is also in your email/i)).toBeInTheDocument();
    });

    it("does not show it for coffee", async () => {
      await renderWith({
        sessionId: "cs_coffee",
        paymentStatus: "paid",
        status: "complete",
        productKey: "coffee",
        bookingUrl: null,
      });

      expect(screen.queryByRole("link", { name: /book your session/i })).not.toBeInTheDocument();
    });

    it("does not show it while the meeting is unpaid", async () => {
      await renderWith({
        sessionId: "cs_meeting",
        paymentStatus: "unpaid",
        status: "complete",
        productKey: "meeting",
        bookingUrl: "https://cal.com/lfariadev/consulting-session",
      });

      expect(screen.queryByRole("link", { name: /book your session/i })).not.toBeInTheDocument();
    });
  });

  it("renders recovery copy when the payment cannot be verified", async () => {
    mockFetchGql.mockRejectedValue(new Error("not found"));

    const page = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: "missing" }),
    });

    render(page);

    expect(screen.getByText(/payment status unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/we could not verify this payment yet/i)).toBeInTheDocument();
  });
});
