import { NextRequest } from "next/server";
import { processRetellGeneralWebhook } from "@/lib/api/retellWebhookGeneral";

export async function POST(req: NextRequest) {
  return await processRetellGeneralWebhook(req);
}

// Allow POST without authentication (Retell will send events)
export const runtime = "nodejs";
