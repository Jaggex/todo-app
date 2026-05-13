import { test as setup } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

setup("authenticate", async ({ page }) => {
  await page.goto("/signin");
  await page.getByPlaceholder("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
  await page.context().storageState({ path: "e2e/.auth.json" });
});
