import { button, expect, test, uniqueUsername, visiblePlaceholder, visibleText } from './fixtures';

test('registers, signs out and signs back in', async ({ page }) => {
  const username = uniqueUsername();
  const password = 'password123';

  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await visibleText(page, 'NO ACCOUNT? REGISTER').click();

  await visiblePlaceholder(page, 'Enter username').fill(username);
  await visiblePlaceholder(page, 'Enter email').fill(`${username}@example.com`);
  await visiblePlaceholder(page, 'Min 6 characters').fill(password);
  await button(page, 'CREATE ACCOUNT').click();

  // A new user lands on the Train tab with nothing planned yet
  await expect(visibleText(page, 'CREATE A SPLIT')).toBeVisible();

  // The session survives a reload (tokens in localStorage)
  await page.reload();
  await expect(visibleText(page, 'CREATE A SPLIT')).toBeVisible();

  await page.getByRole('tab', { name: /profile/i }).click();
  await expect(visibleText(page, `${username}@example.com`).first()).toBeVisible();
  await visibleText(page, 'LOGOUT').click();
  // The themed confirm dialog (utils/confirm.ts) renders above the screen, so its button is last
  await expect(visibleText(page, 'Are you sure you want to logout?')).toBeVisible();
  await button(page, 'LOGOUT').last().click();
  await expect(page).toHaveURL(/\/login$/);

  await visiblePlaceholder(page, 'Enter username').fill(username);
  await visiblePlaceholder(page, 'Enter password').fill(password);
  await button(page, 'SIGN IN').click();
  await expect(visibleText(page, 'CREATE A SPLIT')).toBeVisible();
});

test('rejects a wrong password', async ({ page, user }) => {
  await page.goto('/login');
  await visiblePlaceholder(page, 'Enter username').fill(user.username);
  await visiblePlaceholder(page, 'Enter password').fill('not-the-password');
  await button(page, 'SIGN IN').click();

  await expect(visibleText(page, /invalid username or password/i, false)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
