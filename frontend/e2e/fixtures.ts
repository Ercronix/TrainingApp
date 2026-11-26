import { test as base, expect, type Page } from '@playwright/test';
import { E2E_API_URL } from './env';

/** A user registered through the API for one test. */
export type TestUser = {
  userId: number;
  username: string;
  password: string;
  token: string;
  refreshToken: string;
  email: string;
};

let counter = 0;

/** A username no other test (or earlier run against the same DB) has used. */
export function uniqueUsername(prefix = 'e2e'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${process.pid.toString(36)}${counter}`;
}

/** Calls the backend directly, for setup that isn't what a test is about. */
export class Api {
  constructor(private token?: string) {}

  async call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${E2E_API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
    return (res.status === 204 ? null : await res.json()) as T;
  }

  static async register(username = uniqueUsername()): Promise<TestUser> {
    const password = 'password123';
    const email = `${username}@example.com`;
    const data = await new Api().call('POST', '/auth/register', { username, email, password });
    return { ...data, username, password, email };
  }

  /** An active split with one workout and its exercises; returns the ids. */
  async createActiveSplit(
    splitName: string,
    workoutName: string,
    exercises: { name: string; sets: number; reps: number; plannedWeight?: number }[],
  ) {
    const split = await this.call('POST', '/splits', { name: splitName });
    await this.call('PUT', `/splits/${split.id}/activate`);
    const workout = await this.call('POST', `/workouts/split/${split.id}`, { name: workoutName });
    for (const exercise of exercises) {
      await this.call('POST', `/workouts/${workout.id}/exercises`, exercise);
    }
    return { splitId: split.id as number, workoutId: workout.id as number };
  }
}

/**
 * Seeds the tokens the app keeps in localStorage (services/storage.ts on web), so the page
 * opens signed in. Only on the first load of the tab: a later sign-out must stick.
 */
export async function signIn(page: Page, user: TestUser) {
  const authUser = { userId: user.userId, username: user.username, email: user.email };
  await page.addInitScript(
    ({ token, refreshToken, authUser }) => {
      if (sessionStorage.getItem('e2eSeeded')) return;
      sessionStorage.setItem('e2eSeeded', '1');
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    },
    { token: user.token, refreshToken: user.refreshToken, authUser },
  );
}

/**
 * Screens stay mounted under the one on top (stack navigation, tab pager), so text and
 * placeholders are often in the DOM twice. These match only what is visible.
 */
export const visibleText = (page: Page, text: string | RegExp, exact = true) =>
  page.getByText(text, { exact }).filter({ visible: true });

/** A button (`Tactile` has role="button") by its exact label. */
export const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: true }).filter({ visible: true });

export const visiblePlaceholder = (page: Page, placeholder: string) =>
  page.getByPlaceholder(placeholder).filter({ visible: true });

type Fixtures = {
  /** A fresh user, registered through the API. */
  user: TestUser;
  /** The backend, signed in as `user`. */
  api: Api;
  /** A page that opens signed in as `user`. */
  signedInPage: Page;
};

export const test = base.extend<Fixtures>({
  user: async ({}, use) => {
    await use(await Api.register());
  },
  api: async ({ user }, use) => {
    await use(new Api(user.token));
  },
  signedInPage: async ({ page, user }, use) => {
    await signIn(page, user);
    await use(page);
  },
  page: async ({ page }, use) => {
    // Uncaught exceptions in the app fail the test; console noise is left alone
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await use(page);
    expect(errors, 'uncaught exceptions in the page').toEqual([]);
  },
});

export { expect };
