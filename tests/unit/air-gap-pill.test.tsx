import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AirGapPill } from "@/components/hero/air-gap-pill";

describe("AirGapPill", () => {
  it("renders Online when navigator.onLine is true", () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    render(<AirGapPill />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });
  it("flips to Air-gapped on offline event", () => {
    render(<AirGapPill />);
    act(() => {
      Object.defineProperty(window.navigator, "onLine", {
        value: false,
        configurable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText("Air-gapped")).toBeInTheDocument();
  });
});
