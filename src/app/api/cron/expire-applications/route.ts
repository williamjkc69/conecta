import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CANDIDATE_STATUS_IDS } from "@/constants/status";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    // Verify Authorization for Cron Job
    // Vercel Cron uses "Authorization: Bearer <CRON_SECRET>"
    // We can also support "x-api-secret" for manual triggers
    const authHeader = req.headers.get("authorization");
    const secretHeader = req.headers.get("x-api-secret");
    const cronSecret = process.env.CRON_SECRET || process.env.API_SECRET;

    const isValidCron =
      (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (secretHeader && cronSecret && secretHeader === cronSecret);

    // If no secret is configured in env, we might want to fail-safe or warn.
    // Assuming strict security:
    if (cronSecret && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    console.log("[cron/expire-applications] Starting expiration check...");

    const now = new Date().toISOString();

    const { data: expiredApps, error: fetchError } = await supabase
      .from("applications")
      .select("id, status_id, expiration_date")
      .lte("expiration_date", now)
      .eq("status_id", CANDIDATE_STATUS_IDS.INVITED);

    if (fetchError) {
      console.error(
        "[cron/expire-applications] Error fetching applications:",
        fetchError
      );
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredApps || expiredApps.length === 0) {
      console.log(
        "[cron/expire-applications] No expired applications found to update."
      );
      return NextResponse.json({
        message: "No applications to expire",
        count: 0
      });
    }

    console.log(
      `[cron/expire-applications] Found ${expiredApps.length} applications to update.`
    );

    const idsToUpdate = expiredApps.map((app) => app.id);

    if (idsToUpdate.length > 0) {
      const { data: updatedData, error: updateError } = await supabase
        .from("applications")
        .update({
          status_id: CANDIDATE_STATUS_IDS.EXPIRED,
          updated_at: now
        })
        .in("id", idsToUpdate)
        .select();

      if (updateError) {
        console.error(
          "[cron/expire-applications] Error updating applications:",
          updateError
        );
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      console.log(
        `[cron/expire-applications] Successfully expired ${updatedData?.length} applications.`
      );
      return NextResponse.json({
        success: true,
        message: `Expired ${updatedData?.length} applications`,
        updated_count: updatedData?.length,
        ids: idsToUpdate
      });
    }

    return NextResponse.json({ success: true, count: 0 });
  } catch (error: any) {
    console.error("[cron/expire-applications] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
