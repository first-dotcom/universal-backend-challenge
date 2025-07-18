import { sql } from "drizzle-orm";
import db from "./database";
import { pubClient } from "./redis";

export class HealthChecker {
  private lastHeartbeat = Date.now();

  constructor() {
    // Keep heartbeat alive every 5 seconds
    setInterval(() => {
      this.lastHeartbeat = Date.now();
    }, 5000);
  }

  // Liveness: Is the process responsive and not stuck?
  async checkLiveness() {
    const now = Date.now();
    const heartbeatAge = now - this.lastHeartbeat;

    // If heartbeat is too old, process might be stuck
    if (heartbeatAge > 30000) {
      // 30 seconds
      throw new Error(`Heartbeat stale: ${heartbeatAge}ms`);
    }

    // Check if event loop is responsive
    const eventLoopStart = Date.now();
    await new Promise((resolve) => setImmediate(resolve));
    const eventLoopDelay = Date.now() - eventLoopStart;

    if (eventLoopDelay > 1000) {
      // 1 second
      throw new Error(`Event loop blocked: ${eventLoopDelay}ms`);
    }

    return {
      status: "alive",
      heartbeatAge,
      eventLoopDelay,
      timestamp: new Date().toISOString(),
    };
  }

  // Readiness: Can the service handle requests properly?
  async checkReadiness() {
    const checks = [];
    let isReady = true;

    // Check 1: Database connection
    try {
      // Use drizzle's sql method for a simple connection test
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbTime = Date.now() - dbStart;
      checks.push({ name: "database", status: "ok", responseTime: dbTime });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      checks.push({ name: "database", status: "fail", error: errorMessage });
      isReady = false;
    }

    // Check 2: Redis connection
    try {
      const redisStart = Date.now();
      await pubClient.ping();
      const redisTime = Date.now() - redisStart;
      checks.push({ name: "redis", status: "ok", responseTime: redisTime });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      checks.push({ name: "redis", status: "fail", error: errorMessage });
      isReady = false;
    }

    // Check 3: Memory usage (using RSS - Resident Set Size)
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);

    // For containerized environments, we'll use a simple threshold
    // RSS > 500MB would indicate a potential memory issue
    if (memUsageMB > 500) {
      checks.push({ name: "memory", status: "fail", usage: `${memUsageMB}MB` });
      isReady = false;
    } else {
      checks.push({ name: "memory", status: "ok", usage: `${memUsageMB}MB` });
    }

    // Check 4: CPU usage (basic check)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    checks.push({ name: "cpu", status: "ok", usage: `${cpuPercent.toFixed(2)}s` });

    return {
      status: isReady ? "ready" : "not ready",
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new HealthChecker();
