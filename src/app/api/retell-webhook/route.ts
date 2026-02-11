import { NextRequest } from "next/server";
import { processRetellWebhook } from "@/lib/api/retellWebhookAnalysis";

export async function POST(request: NextRequest) {
  return await processRetellWebhook(request);
}
