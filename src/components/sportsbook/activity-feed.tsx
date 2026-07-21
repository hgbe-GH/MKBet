import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { List } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { ActivityFeedItem } from "@/components/sportsbook/activity-feed-item";
import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export function ActivityFeed({ events }: { events: TimelineEvent[] }) {
  return (
    <section aria-labelledby="recent-activity-title">
      <Card padding={5}>
        <VStack gap={3}>
          <div>
            <Heading id="recent-activity-title" level={2}>
              Activité récente
            </Heading>
            <Text color="secondary" type="supporting">
              Les dernières modifications de marchés consignées dans la salle.
            </Text>
          </div>
          {events.length > 0 ? (
            <List density="compact" hasDividers>
              {events.map((event) => (
                <ActivityFeedItem event={event} key={event.id} />
              ))}
            </List>
          ) : (
            <Text color="secondary">Aucune activité de marché récente.</Text>
          )}
        </VStack>
      </Card>
    </section>
  );
}
