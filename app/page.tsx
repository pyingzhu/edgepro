import { Hero } from "@/components/hero/hero";
import { Button } from "@/components/primitives/button";

export default function Page() {
  return (
    <main>
      <Hero
        cta={
          <Button size="xl" shape="pill">
            📣 Press &amp; hold to speak
          </Button>
        }
      />
    </main>
  );
}
