import { expect, test, visiblePlaceholder, visibleText } from './fixtures';

test('builds a split with a workout and an exercise', async ({ signedInPage: page }) => {
  await page.goto('/');

  await visibleText(page, 'CREATE A SPLIT').click();
  await visiblePlaceholder(page, 'PPL, Upper/Lower...').fill('Push Pull Legs');
  await visibleText(page, 'CREATE SPLIT').click();

  // A new split isn't active yet: pick it as the one being trained
  await visibleText(page, 'CHOOSE A SPLIT').click();
  await visibleText(page, 'Push Pull Legs').click();

  await visibleText(page, 'ADD WORKOUT').click();
  await visiblePlaceholder(page, 'Push Day').fill('Push');
  await visibleText(page, 'CREATE WORKOUT').click();
  await expect(visibleText(page, 'START PUSH')).toBeVisible();

  // Open the workout from "All workouts" and add an exercise
  await visibleText(page, 'ALL WORKOUTS').waitFor();
  await visibleText(page, 'Push').last().click();
  await expect(visibleText(page, 'NO EXERCISES YET')).toBeVisible();
  await visibleText(page, '+').click();

  await visiblePlaceholder(page, 'Bench Press, Squat...').fill('Bench Press');
  await visiblePlaceholder(page, '4').fill('3');
  await visiblePlaceholder(page, '10').fill('8');
  await visiblePlaceholder(page, '80').fill('60');
  await visibleText(page, 'ADD EXERCISE').click();

  await expect(visibleText(page, 'Bench Press')).toBeVisible();
  await expect(visibleText(page, '1 EXERCISE', false)).toBeVisible();

  // Back on the Train tab, the workout is up next with its plan
  await page.goto('/');
  await expect(visibleText(page, 'START PUSH')).toBeVisible();
  await expect(visibleText(page, 'Bench Press')).toBeVisible();
});
