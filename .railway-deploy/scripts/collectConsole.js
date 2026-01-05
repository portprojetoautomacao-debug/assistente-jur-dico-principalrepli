import { chromium } from "playwright";

(async () => {
  const url = process.argv[2] || "http://localhost:4175";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  /** @type {Array<{type: string, text: string}>} */
  const messages = [];

  page.on("console", (msg) => {
    messages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === "error") {
      console.error("[ERROR]", msg.text());
    } else if (msg.type() === "warning") {
      console.warn("[WARNING]", msg.text());
    } else {
      console.log("[LOG]", msg.text());
    }
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE ERROR]", err);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    console.log("Page loaded:", url);
    // Wait a bit for runtime console messages
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const title = await page.title();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Navigation error:", error.message || error);
  } finally {
    await browser.close();
    // Summary
    console.log("Collected messages:", JSON.stringify(messages, null, 2));
    const errors = messages.filter((m) => m.type === "error");
    process.exit(errors.length > 0 ? 1 : 0);
  }
})();
