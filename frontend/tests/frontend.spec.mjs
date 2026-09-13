import { test as base, expect } from "@playwright/test";

const test = base.extend({
  page: async ({ page }, run) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/hydration|Minified React error/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    // Exercise the frontend without sending messages to deployed AI services.
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === "http://127.0.0.1:4371") {
        return route.continue();
      }
      if (url.hostname.endsWith(".execute-api.us-west-2.amazonaws.com") &&
          route.request().method() === "GET") {
        return route.fulfill({ json: { hello: "world" } });
      }
      errors.push(`Unexpected external request: ${route.request().method()} ${url.origin}${url.pathname}`);
      return route.abort();
    });
    await run(page);
    expect(errors).toEqual([]);
  },
});

const routes = [
  ["/", "Building the AI Apps of the Future"],
  ["/kitsune", "Kitsune AI"],
  ["/mimir", "Mimir AI"],
  ["/agents", "Agent Smith"],
  ["/tutorial", "ChatGPT"],
];

for (const [path, heading] of routes) {
  test(`production route ${path} renders and hydrates`, async ({ page }, testInfo) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page).toHaveTitle("🦊 Kitsune AI");
    await expect(page.getByRole("link", { name: "AI-41", exact: true })).toBeVisible();
    await expect(page.getByText("Taught by Shawn Esquivel")).toBeVisible();
    if (path === "/" || path === "/kitsune") {
      await page.screenshot({ path: testInfo.outputPath("page.png"), fullPage: true });
    }
  });
}

test("local assets and optimized images load; unknown routes stay 404", async ({ page, request }) => {
  await page.goto("/");
  const galleryImage = page.getByRole("img", { name: "PDF GPT", exact: true });
  await expect(galleryImage).toBeVisible();
  await expect.poll(() => galleryImage.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  const optimized = await request.get("/_next/image?url=%2Fassets%2Fimages%2Fpdf.png&w=640&q=75");
  expect(optimized.status()).toBe(200);
  expect(optimized.headers()["content-type"]).toMatch(/^image\//);
  expect((await request.get("/hamburger.svg")).status()).toBe(200);
  expect((await request.get("/missing-lesson")).status()).toBe(404);
});

for (const path of ["/kitsune", "/mimir"]) {
  test(`${path} sends messages, shows sources, and resets its chat`, async ({ page, context }) => {
    let payload;
    await page.route(/https:\/\/npn9lcae22\.execute-api\.us-west-2\.amazonaws\.com\/api\/{1,2}chat$/, async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { content: "Mock assistant reply", source_documents: "Mock source document" } });
    });
    await page.goto(path);
    await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === "chatId")?.value).toBeTruthy();
    const oldId = (await context.cookies()).find((cookie) => cookie.name === "chatId").value;
    await page.reload();
    await expect(page.getByPlaceholder("Type your message...")).toBeVisible();
    expect((await context.cookies()).find((cookie) => cookie.name === "chatId").value).toBe(oldId);
    if (path === "/kitsune") {
      await page.getByLabel("Choose Your Character").selectOption("trainer");
      await page.getByLabel("Model", { exact: true }).selectOption("gpt-4");
      await page.getByLabel("Temperature:").press("End");
    }
    await page.getByPlaceholder("Type your message...").fill("Migration test message");
    await page.getByRole("button", { name: "Enter", exact: true }).click();
    await expect(page.getByText("Migration test message", { exact: true })).toBeVisible();
    await expect(page.getByText("Mock assistant reply", { exact: true })).toBeVisible();
    expect(payload).toMatchObject({
      chat_id: oldId,
      message: "Migration test message",
      apiKey: null,
      model: path === "/kitsune" ? "gpt-4" : "gpt-3.5-turbo",
      prompt_template: path === "/kitsune" ? "trainer" : "girlfriend",
      temperature: path === "/kitsune" ? "1" : 0.5,
    });
    expect(Number.isInteger(payload.timestamp)).toBe(true);
    await expect(page.getByPlaceholder("Type your message...")).toHaveValue("");
    await page.getByRole("button", { name: "Function Call Results (Show)" }).click();
    await expect(page.getByText("Mock source document", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Function Call Results (Hide)" }).click();
    await expect(page.getByText("Mock source document", { exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: "New Chat", exact: true }).click();
    await expect(page.getByText("Mock assistant reply", { exact: true })).not.toBeVisible();
    await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === "chatId")?.value).not.toBe(oldId);
  });
}

test("failed chat requests retain the user message and display the existing error", async ({ page }) => {
  await page.route("**/api/chat", (route) => route.fulfill({ status: 503, json: { error: "Service unavailable" } }));
  await page.goto("/kitsune");
  await page.getByPlaceholder("Type your message...").fill("Failure control");
  await page.getByPlaceholder("Type your message...").press("Enter");
  await expect(page.getByText("Failure control", { exact: true })).toBeVisible();
  await expect(page.getByText("Error fetching transcript. Please try again.", { exact: true })).toBeVisible();
});

test("tutorial submission renders the returned JSON", async ({ page }) => {
  let payload;
  await page.route("**/api/tutorial", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { response: "Tutorial test reply" } });
  });
  await page.goto("/tutorial");
  await page.getByPlaceholder("Type your message...").fill("Tutorial test message");
  await page.getByRole("button", { name: "Send 1", exact: true }).click();
  await expect(page.locator("pre")).toContainText("Tutorial test reply");
  expect(payload).toEqual({ message: "Tutorial test message" });
});

test("agents settings and request contract survive the upgrade", async ({ page }) => {
  let payload;
  await page.route("http://127.0.0.1:8000/chat", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { data: { response: "Agent test reply" } } });
  });
  await page.goto("/agents");
  await page.getByLabel("Model", { exact: true }).selectOption("gpt-4");
  await page.getByLabel("OpenAI API Key").fill("mock-key-never-sent-to-a-service");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect.poll(() => payload).toMatchObject({
    message: "how to start a nextJS app?",
    model: "gpt-4",
    apiKey: "mock-key-never-sent-to-a-service",
  });
  // The starter's Agents page uses the older response shape. Keep that known
  // limitation visible rather than claiming the migration fixes the lesson.
  await expect(page.getByText("No message found.", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "New Chat", exact: true }).click();
  await expect(page.getByText("No message found.", { exact: true })).toHaveCount(0);
});
