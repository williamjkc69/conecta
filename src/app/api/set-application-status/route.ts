import { NextRequest, NextResponse } from "next/server";
import { updateApplicationStatusLogic } from "@/lib/api/setApplicationStatus";
import { verifyWebhookToken, verifyUserSession } from "@/lib/server-auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabase;
    let isAdminRequest = false;

    // Check for API Secret (Webhook/Admin)
    if (verifyWebhookToken(req)) {
      isAdminRequest = true;
      console.log("[set-application-status] Admin/Webhook Access Verified");
      // Admin client will be created inside updateApplicationStatusLogic if isAdmin is true
      // But we need to pass true/false.
      // Wait, updateApplicationStatusLogic takes (data, isAdmin, sessionSupabase).
      // If isAdmin is true, it creates its own client.
      // If isAdmin is false, it needs sessionSupabase.
    } else {
      // User Session Check
      console.log("[set-application-status] User Session Check");
      const session = await verifyUserSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      supabase = session.supabase;
    }

    const body = await req.json();

    const result = await updateApplicationStatusLogic(
      body,
      isAdminRequest,
      supabase
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[set-application-status] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
