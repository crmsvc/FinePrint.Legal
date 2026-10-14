import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { siteConfig } from "@/lib/site/config";
import { createHash } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    siteConfig.rateLimit.maxRequests,
    "24 h"
  ),
  analytics: true,
  prefix: "fineprint:ratelimit",
});

function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function checkRateLimit(ip: string) {
  const identifier = hashIP(ip);
  const { success, remaining, reset } = await ratelimit.limit(identifier);

  return {
    success,
    remaining,
    reset: new Date(reset),
    limit: siteConfig.rateLimit.maxRequests,
  };
}
