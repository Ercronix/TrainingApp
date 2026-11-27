// Ports of the backend and the web export the end-to-end tests start. They differ from the
// dev stack (backend 8080, Expo 8081, run-app skill 8082), so the tests never talk to a
// backend started with the dev rate limits or an older build.
export const E2E_API_PORT = Number(process.env.E2E_API_PORT ?? 8090);
export const E2E_WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 8093);
export const E2E_API_URL = `http://localhost:${E2E_API_PORT}/api`;
export const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
