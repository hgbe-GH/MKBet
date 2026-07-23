import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        className="relative isolate flex flex-1 items-center overflow-hidden px-5 py-12 sm:px-8"
        data-public-aurora
        id="main-content"
      >
        <div
          aria-hidden="true"
          className="absolute top-[12%] right-[-8rem] -z-10 h-80 w-80 rounded-full bg-[var(--brand)]/25 blur-3xl"
        />
        <section className="mk-enter mx-auto grid w-full max-w-6xl gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <VStack gap={5}>
            <Badge label="Salle privée · 7 membres" variant="red" />
            <Text color="secondary" type="label">
              Margot × Kévin
            </Text>
            <Heading
              className="max-w-4xl text-5xl leading-[0.9] font-black tracking-[-0.07em] text-balance sm:text-7xl lg:text-[6.5rem]"
              level={1}
              type="display-1"
            >
              Tout se joue{" "}
              <span className="text-[var(--color-accent)]">entre nous.</span>
            </Heading>
            <Text as="p" className="max-w-xl" color="secondary" type="large">
              Une preuve, deux votes, une décision. Suis l’histoire de Margot et
              Kévin en MKB fictifs.
            </Text>
          </VStack>
          <Card padding={6} variant="muted">
            <VStack gap={4}>
              <Badge label="Le marché est ouvert" variant="success" />
              <Heading level={2}>Entre dans la salle.</Heading>
              <Button
                href="/login?next=/direct"
                label="Entrer dans la salle"
                size="lg"
                variant="primary"
                width="100%"
              />
              <Text color="secondary" type="supporting">
                100 % monnaie fictive
              </Text>
            </VStack>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
