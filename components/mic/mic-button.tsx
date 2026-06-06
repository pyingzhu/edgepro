"use client";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export function MicButton({
  recording,
  disabled,
  onPress,
  onRelease,
}: {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <Button
      size="2xl"
      shape="pill"
      disabled={disabled}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={recording ? onRelease : undefined}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      className={cn(
        "gap-3 font-semibold tracking-wide",
        recording && "animate-pulse-glow",
      )}
    >
      <span className="text-2xl">{recording ? "🔴" : "🎙"}</span>
      {recording
        ? "Listening… 聞いています"
        : "Press & hold to speak · 押して話す"}
    </Button>
  );
}
