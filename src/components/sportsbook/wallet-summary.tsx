import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function WalletSummary({ balanceMkb }: { balanceMkb: number }) {
  return (
    <section aria-labelledby="wallet-summary-title">
      <Card padding={5} variant="muted">
        <VStack gap={3}>
          <Badge label="Portefeuille fictif" variant="info" />
          <Heading id="wallet-summary-title" level={2}>
            {new Intl.NumberFormat("fr-FR").format(balanceMkb)} MKB
          </Heading>
          <MetadataList>
            <MetadataListItem label="Valeur financière">
              Aucune
            </MetadataListItem>
          </MetadataList>
          <Text color="secondary" type="supporting">
            Ce solde ne peut être ni converti ni retiré.
          </Text>
        </VStack>
      </Card>
    </section>
  );
}
