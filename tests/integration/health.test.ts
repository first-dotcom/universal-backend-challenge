import { describe, expect, it } from "vitest";
import { ApiClient } from "../helpers/api-client";
import { expectValidHealthResponse } from "../helpers/assertions";

const client = new ApiClient();

describe("Health Endpoints", () => {
  describe("Legacy Health Endpoint", () => {
    it("should return combined health status", async () => {
      const response = await client.health();

      expect(response.status).toBeDefined();
      expect(["OK", "Unhealthy"]).toContain(response.status);
      expect(response.timestamp).toBeDefined();
      expect(response.details).toBeDefined();
      expect(response.details.liveness).toBeDefined();
      expect(response.details.readiness).toBeDefined();
    });

    it("should include both liveness and readiness details", async () => {
      const response = await client.health();

      // Check liveness details
      expect(response.details.liveness.status).toBeDefined();
      expect(["alive", "not alive"]).toContain(response.details.liveness.status);

      // Check readiness details
      expect(response.details.readiness.status).toBeDefined();
      expect(["ready", "not ready"]).toContain(response.details.readiness.status);
    });

    it("should return consistent timestamp format", async () => {
      const response = await client.health();

      const timestamp = new Date(response.timestamp);
      expect(timestamp.toISOString()).toBe(response.timestamp);
    });

    it("should handle multiple concurrent requests", async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => client.health());
      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBeDefined();
        expect(response.details).toBeDefined();
      });
    });
  });

  describe("Liveness Endpoint", () => {
    it("should return alive status", async () => {
      const response = await client.request<{
        status: string;
        timestamp: string;
        heartbeatAge: number;
        eventLoopDelay: number;
      }>("GET", "/health/live");

      expect(response.success).toBe(true);
      expect(response.data!.status).toBe("alive");
      expect(response.data!.timestamp).toBeDefined();
      expect(response.data!.heartbeatAge).toBeDefined();
      expect(response.data!.eventLoopDelay).toBeDefined();
    });

    it("should respond quickly (< 500ms)", async () => {
      const start = Date.now();
      await client.request("GET", "/health/live");
      const responseTime = Date.now() - start;

      expect(responseTime).toBeLessThan(500);
    });

    it("should handle concurrent liveness checks", async () => {
      const requests = Array(20)
        .fill(null)
        .map(() =>
          client.request<{
            status: string;
            timestamp: string;
            heartbeatAge: number;
            eventLoopDelay: number;
          }>("GET", "/health/live"),
        );
      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.success).toBe(true);
        expect(response.data!.status).toBe("alive");
      });
    });
  });

  describe("Readiness Endpoint", () => {
    it("should return ready status with checks", async () => {
      const response = await client.request<{
        status: string;
        timestamp: string;
        checks: Array<{
          name: string;
          status: string;
          error?: string;
        }>;
      }>("GET", "/health/ready");

      expect(response.success).toBe(true);
      expect(response.data!.status).toBe("ready");
      expect(response.data!.checks).toBeDefined();
      expect(Array.isArray(response.data!.checks)).toBe(true);

      // Should have database, redis, memory, and cpu checks
      const checkNames = response.data!.checks.map((c) => c.name);
      expect(checkNames).toContain("database");
      expect(checkNames).toContain("redis");
      expect(checkNames).toContain("memory");
      expect(checkNames).toContain("cpu");
    });

    it("should show individual service status", async () => {
      const response = await client.request<{
        status: string;
        checks: Array<{
          name: string;
          status: string;
          error?: string;
        }>;
      }>("GET", "/health/ready");

      expect(response.success).toBe(true);
      response.data!.checks.forEach((check) => {
        expect(check.name).toBeDefined();
        expect(check.status).toBeDefined();
        expect(["ok", "fail"]).toContain(check.status);
      });
    });

    it("should respond with appropriate status codes", async () => {
      try {
        const response = await client.request("GET", "/health/ready");
        // If successful, should be 200
        expect(response.success).toBe(true);
      } catch (error) {
        // If failed, should be 503
        expect((error as any).status).toBe(503);
      }
    });
  });
});
