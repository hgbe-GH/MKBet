import { Text } from "@astryxdesign/core/Text";
import { TopNav } from "@astryxdesign/core/TopNav";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <TopNav
        endContent={
          <Text color="secondary" type="label">
            Margot × Kévin
          </Text>
        }
        heading={
          <a
            aria-label="MK Bet, aller au contenu principal"
            className="inline-flex min-h-11 items-center text-lg font-black tracking-[-0.06em]"
            href="#main-content"
          >
            MK<span className="text-[var(--color-accent)]">BET</span>
          </a>
        }
        label="Navigation publique"
      />
    </header>
  );
}
