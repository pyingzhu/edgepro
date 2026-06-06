export function TranscriptBubble({ text }: { text: string }) {
  return (
    <div className="rounded-card p-6 mb-8 border border-border-subtle bg-surface min-h-[80px]">
      <p className="text-base uppercase tracking-[0.16em] mb-3 text-foreground-muted">
        Transcript · 文字起こし
      </p>
      <p className="text-3xl leading-relaxed font-mono text-foreground">
        {text || (
          <span className="text-foreground-subtle">
            Press &amp; hold the microphone to begin · マイクを押して話す
          </span>
        )}
      </p>
    </div>
  );
}
