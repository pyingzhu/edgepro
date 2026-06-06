import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AirGapPill } from "@/components/hero/air-gap-pill";

describe("AirGapPill", () => {
  it("renders Online when navigator.onLine is true", async () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    render(<AirGapPill />);
    expect(await screen.findByText("Online")).toBeInTheDocument();
  });
  it("flips to Air-gapped on offline event", async () => {
    render(<AirGapPill />);
    // wait for initial mount
    expect(
      await screen.findByText(/Online|Air-gapped|Checking/),
    ).toBeInTheDocument();
    act(() => {
      Object.defineProperty(window.navigator, "onLine", {
        value: false,
        configurable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });
    expect(await screen.findByText("Air-gapped")).toBeInTheDocument();
  });
});
