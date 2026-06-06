"use client";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import type { MicPermission } from "@/hooks/use-mic-capture";

type Props = {
  recording: boolean;
  permission: MicPermission;
  disabled?: boolean;
  onPress: () => void;
  onRelease: () => void;
  onEnable: () => void;
};

export function MicButton({
  recording,
  permission,
  disabled,
  onPress,
  onRelease,
  onEnable,
}: Props) {
  const needsPermission = permission !== "granted";

  if (needsPermission) {
    return (
      <Button
        size="2xl"
        shape="pill"
        variant={permission === "denied" ? "outline" : "primary"}
        disabled={disabled}
        onClick={onEnable}
        className="gap-3 font-semibold tracking-wide"
      >
        <span className="text-2xl">
          {permission === "denied" ? "🎤" : "🎙"}
        </span>
        {permission === "denied"
          ? "Allow microphone · マイクを許可"
          : permission === "prompt"
            ? "Enable microphone · マイクを有効に"
            : "Enable microphone · マイクを有効に"}
      </Button>
    );
  }

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
        "gap-3 font-semibold tracking-wide select-none",
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
