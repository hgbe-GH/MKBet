import { expect, test, type Page } from "@playwright/test";

import { moveOutcomeOdds } from "./support/database";

async function walletBalance(page: Page): Promise<number> {
  await page.goto("/wallet");
  const text = await page
    .locator("dl > div")
    .filter({ hasText: "Solde" })
    .locator("dd")
    .textContent();
  const value = Number.parseInt(text ?? "", 10);
  expect(Number.isFinite(value)).toBe(true);
  return value;
}

test("quote expiry, invalidation and atomic double-click placement stay safe", async ({
  page,
}) => {
  const initialBalance = await walletBalance(page);
  await page.goto("/bets");
  const initialTickets = await page.getByRole("article").count();

  await page.clock.install({ time: Date.now() });
  await page.goto("/markets");
  const odd = page
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .first();
  await odd.click();
  const ticket = page.getByLabel("Ticket de pari").filter({ visible: true });
  const stake = ticket.getByLabel("Mise en MKB");

  await stake.fill("4");
  await expect(ticket.getByText("Mise minimale : 5 MKB.")).toBeVisible();
  await stake.fill("10");
  await ticket.getByRole("button", { name: "VÉRIFIER LE TICKET" }).click();
  await expect(
    ticket
      .getByRole("paragraph")
      .filter({ hasText: /Devis confirmé par MK Bet/ }),
  ).toBeVisible();

  await stake.fill("11");
  await expect(ticket.getByText("À vérifier")).toBeVisible();
  await stake.fill("10");
  await ticket.getByRole("button", { name: "VÉRIFIER LE TICKET" }).click();
  await expect(ticket.getByText(/Devis valable encore/)).toBeVisible();

  await page.clock.fastForward(61_000);
  await expect(
    ticket.getByRole("button", { name: "ACTUALISER LES COTES" }),
  ).toBeVisible();
  await page.clock.setSystemTime(Date.now());
  await ticket.getByRole("button", { name: "ACTUALISER LES COTES" }).click();
  const place = ticket.getByRole("button", { name: "PLACER MON PRONOSTIC" });
  await expect(place).toBeVisible();
  await place.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(ticket.getByText(/Ticket #[A-Z0-9]+/)).toBeVisible();

  expect(await walletBalance(page)).toBe(initialBalance - 10);
  await page.goto("/bets");
  await expect(page.getByRole("article")).toHaveCount(initialTickets + 1);
  await expect(page.getByText("Retour potentiel").first()).toBeVisible();
  await expect(page.getByText(/Figée/).first()).toBeVisible();
  await expect(page.getByText("OPEN").first()).toBeVisible();
});

test("an odds change refuses placement without debiting the wallet", async ({
  page,
}) => {
  const initialBalance = await walletBalance(page);
  await page.goto("/markets");
  const odd = page
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .first();
  const marketId = await odd.getAttribute("data-market-id");
  const outcomeId = await odd.getAttribute("data-outcome-id");
  expect(marketId).toBeTruthy();
  expect(outcomeId).toBeTruthy();
  await odd.click();
  const ticket = page.getByLabel("Ticket de pari").filter({ visible: true });
  await ticket.getByRole("button", { name: "VÉRIFIER LE TICKET" }).click();
  await expect(
    ticket.getByRole("button", { name: "PLACER MON PRONOSTIC" }),
  ).toBeVisible();

  moveOutcomeOdds(marketId ?? "", outcomeId ?? "");
  await ticket.getByRole("button", { name: "PLACER MON PRONOSTIC" }).click();
  await expect(
    ticket.getByRole("paragraph").filter({ hasText: /Les cotes ont évolué/ }),
  ).toBeVisible();
  expect(await walletBalance(page)).toBe(initialBalance);
});
