import { expect, test, visiblePlaceholder, visibleText } from './fixtures';

test('trains a session from start to history', async ({ signedInPage: page, api }) => {
  await api.createActiveSplit('E2E Split', 'Push', [
    { name: 'Bench Press', sets: 2, reps: 8, plannedWeight: 60 },
  ]);

  await page.goto('/');
  await visibleText(page, 'START PUSH').click();
  // Wait for the session screen: a tap during its enter transition can get lost
  await expect(visibleText(page, '0 of 1 done')).toBeVisible();
  await visibleText(page, 'Bench Press').click();

  // The first set starts at the planned weight; go a bit heavier, then log both sets
  await expect(visibleText(page, 'PLAN: 2 × 8 reps @ 60 kg')).toBeVisible();
  const weight = visiblePlaceholder(page, '60');
  await expect(weight).toHaveValue('60');
  await weight.fill('62.5');
  await visibleText(page, 'LOG SET').click();
  await expect(visibleText(page, /1 SET LOGGED/)).toBeVisible();
  await visibleText(page, 'LOG SET').click();
  await expect(visibleText(page, /2 SETS LOGGED/)).toBeVisible();
  await visibleText(page, /^DONE/).click();

  await expect(visibleText(page, 'All done')).toBeVisible();
  await expect(visibleText(page, '8@62.5 · 8@60 kg')).toBeVisible();
  await visibleText(page, 'COMPLETE SESSION').click();

  // Summary: 8 × 62.5 + 8 × 60 = 980 kg
  await expect(visibleText(page, 'SESSION COMPLETE')).toBeVisible();
  await expect(visibleText(page, '980')).toBeVisible();
  await visiblePlaceholder(page, 'Add a note: how it went, what to change...').fill('Felt strong');
  await visibleText(page, /^DONE$/).click();

  await expect(visibleText(page, 'last done today')).toBeVisible();
  await page.getByRole('tab', { name: /history/i }).click();
  await expect(visibleText(page, '"Felt strong"')).toBeVisible();
  await expect(visibleText(page, /^E2E Split · /)).toBeVisible();
});

test('counts an exercise stopped short of the plan as done, not skipped', async ({ signedInPage: page, api }) => {
  await api.createActiveSplit('E2E Split', 'Push', [
    { name: 'Bench Press', sets: 4, reps: 8, plannedWeight: 60 },
  ]);

  await page.goto('/');
  await visibleText(page, 'START PUSH').click();
  await expect(visibleText(page, '0 of 1 done')).toBeVisible();
  await visibleText(page, 'Bench Press').click();

  await expect(visibleText(page, 'PLAN: 4 × 8 reps @ 60 kg')).toBeVisible();
  await visibleText(page, 'LOG SET').click();
  await expect(visibleText(page, /1 SET LOGGED/)).toBeVisible();
  await visibleText(page, 'LOG SET').click();
  await expect(visibleText(page, /2 SETS LOGGED/)).toBeVisible();
  await visibleText(page, /^DONE/).click();

  await expect(visibleText(page, 'All done')).toBeVisible();
  await visibleText(page, 'COMPLETE SESSION').click();
  await expect(visibleText(page, 'SESSION COMPLETE')).toBeVisible();
  await expect(visibleText(page, '2×8 @ 60 kg')).toBeVisible();
  await expect(visibleText(page, 'Skipped')).toHaveCount(0);
});

test('keeps sets logged offline and syncs them when back online', async ({ signedInPage: page, api, context }) => {
  await api.createActiveSplit('E2E Split', 'Push', [
    { name: 'Bench Press', sets: 1, reps: 5, plannedWeight: 100 },
  ]);

  await page.goto('/');
  await visibleText(page, 'START PUSH').click();
  // Wait for the session screen: a tap during its enter transition can get lost
  await expect(visibleText(page, '0 of 1 done')).toBeVisible();
  await visibleText(page, 'Bench Press').click();
  await expect(visibleText(page, 'PLAN: 1 × 5 reps @ 100 kg')).toBeVisible();

  await context.setOffline(true);
  await visibleText(page, 'LOG SET').click();
  await expect(visibleText(page, /1 SET LOGGED/)).toBeVisible();

  const loggedSets = async () => {
    const [active] = await api.call<{ id: number }[]>('GET', '/training-logs/active');
    const log = await api.call('GET', `/training-logs/${active.id}`);
    return log.exercises.flatMap((e: { sets?: unknown[] }) => e.sets ?? []).length;
  };
  // Nothing reached the server while offline...
  expect(await loggedSets()).toBe(0);

  // ...and the paused write goes through once the network is back
  await context.setOffline(false);
  await expect.poll(loggedSets).toBe(1);
});
