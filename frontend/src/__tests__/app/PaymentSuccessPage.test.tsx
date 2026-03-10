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
        customerEmail: "paid@example.com",
      },
    });

    const page = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: "cs_paid" }),
    });

    render(page);

    expect(screen.getByText(/payment complete/i)).toBeInTheDocument();
    expect(screen.getByText(/thank you for your support/i)).toBeInTheDocument();
    expect(screen.getByText(/paid@example.com/i)).toBeInTheDocument();
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
