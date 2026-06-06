export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p
          className="text-foreground-muted text-sm tracking-[0.18em] uppercase mb-3"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          EdgePro
        </p>
        <h1
          className="text-5xl font-light"
          style={{ color: "var(--color-foreground)" }}
        >
          Offline 介護 申し送り Copilot
        </h1>
        <p
          className="mt-4 text-base"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          Bootstrap OK. Hero arrives in Milestone 5.
        </p>
      </div>
    </main>
  );
}
