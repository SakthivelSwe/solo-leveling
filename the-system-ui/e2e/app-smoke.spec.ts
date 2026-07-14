import { expect, test } from '@playwright/test';

test('registers a new hunter and opens the main web journeys', async ({ page }) => {
  const username = `uihunter${Date.now()}`;

  await page.goto('/register');
  await page.getByLabel('HUNTER ID').fill(username);
  await page.getByLabel('DISPLAY NAME').fill('UI Hunter');
  await page.getByLabel('EMAIL').fill(`${username}@example.com`);
  await page.locator('#reg-password').fill('Password123!');
  await page.getByRole('button', { name: /awaken/i }).click();

  await expect(page).toHaveURL(/\/system$/);
  await expect(page.getByText('THE SYSTEM').first()).toBeVisible();

  const questsTab = page.locator('#tab-quests');
  if (await questsTab.isVisible()) {
    await questsTab.click();
  }

  await expect(page.getByText(/QUESTS CLEARED|CLEARED/i).first()).toBeVisible();

  const journeys = [
    { path: '/habits', text: /DISCIPLINE GRID|NO HABITS FORGED/i },
    { path: '/life', text: /LIFE OS|DSA GRIND/i },
    { path: '/ai', text: /AI|MENTOR|BOSS/i },
    { path: '/achievements', text: /ACHIEVEMENTS|RANKS|TITLE/i },
    { path: '/notifications', text: /NOTIFICATIONS|ALERTS|SYSTEM/i },
    { path: '/insights', text: /INSIGHTS|REPORT|HEATMAP/i },
  ];

  for (const journey of journeys) {
    await page.goto(journey.path);
    await expect(page.locator('body')).toContainText(journey.text);
  }
});

test('redirects protected routes to login when unauthenticated', async ({ page }) => {
  await page.goto('/system');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/ENTER YOUR CREDENTIALS|HUNTER/i).first()).toBeVisible();
});
