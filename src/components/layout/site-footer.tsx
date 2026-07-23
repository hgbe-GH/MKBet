import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <HStack
        className="mx-auto min-h-16 w-full max-w-6xl flex-col px-5 py-4 text-center sm:flex-row sm:px-8 sm:text-left"
        gap={2}
        justify="between"
      >
        <Text color="secondary" type="supporting">
          MK Bet, ligue privée entre amis
        </Text>
        <Text color="secondary" type="supporting">
          Aucun pari en argent réel
        </Text>
      </HStack>
    </footer>
  );
}
