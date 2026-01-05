/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Check KV Connection
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
    }

    const kv = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const ping = await kv.ping();
    results.checks.kv = { status: "ok", ping };

    // 2. Check Queues
    const taskQueue = ((await kv.get("agent-task-queue")) as any[]) || [];
    const notificationQueue = ((await kv.get("notification-queue")) as any[]) || [];

    results.checks.queues = {
      taskQueueLength: taskQueue.length,
      notificationQueueLength: notificationQueue.length,
    };

    // 3. Check Monitored Lawyers
    const lawyers = ((await kv.get("monitored-lawyers")) as any[]) || [];
    results.checks.lawyers = {
      count: lawyers.length,
      names: lawyers.map((l: any) => l.name),
    };

    // 4. Inject Test Data (Optional via ?inject=true)
    if (req.query.inject === "true") {
      // Inject Test Notification
      const testNotification = {
        id: crypto.randomUUID(),
        type: "system",
        title: "Teste de Sistema",
        message: "Esta é uma notificação de teste gerada manualmente.",
        createdAt: new Date().toISOString(),
        sent: false,
      };
      notificationQueue.push(testNotification);
      await kv.set("notification-queue", notificationQueue);

      // Inject Test Task
      const testTask = {
        id: crypto.randomUUID(),
        agentId: "harvey",
        type: "system_test",
        status: "pending",
        priority: "medium",
        createdAt: new Date().toISOString(),
        data: { source: "manual_test" },
      };
      taskQueue.push(testTask);
      await kv.set("agent-task-queue", taskQueue);

      results.injected = {
        notification: testNotification.id,
        task: testTask.id,
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({
      error: "System check failed",
      details: error instanceof Error ? error.message : String(error),
      results,
    });
  }
}
