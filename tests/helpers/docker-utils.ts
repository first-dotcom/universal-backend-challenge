import { ApiClient } from "./api-client";

export async function waitForHealthy(
  client: ApiClient,
  maxRetries = 30,
  retryDelay = 1000,
): Promise<void> {
  console.log("🔍 Waiting for API to be healthy...");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.health({ retries: 0, timeout: 2000 });

      if (response.status === "OK") {
        console.log(`✅ API is healthy (attempt ${attempt + 1})`);
        return;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw new Error(`API failed to become healthy after ${maxRetries} attempts: ${error}`);
      }

      console.log(
        `⏳ API not ready yet (attempt ${
          attempt + 1
        }/${maxRetries}), retrying in ${retryDelay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`API failed to become healthy after ${maxRetries} attempts`);
}

export async function measureResponseTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; responseTime: number }> {
  const start = performance.now();
  const result = await fn();
  const responseTime = performance.now() - start;
  return { result, responseTime };
}
