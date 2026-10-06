import React from "react";

export function FabStack({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="fab-stack"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
    >
      {children}
    </div>
  );
}
