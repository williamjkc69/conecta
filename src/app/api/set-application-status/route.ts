import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    let supabase;
    const isServiceKey = !!serviceRoleKey;

    if (isServiceKey) {
      console.log(
        "[set-application-status] Using Service Role Key (Admin Mode)"
      );
      supabase = createClient(supabaseUrl, serviceRoleKey!, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    } else {
      console.log("[set-application-status] Using User Session (Cookie Mode)");
      const cookieStore = cookies();
      supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {}
          }
        }
      });
    }

    let body;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = {};
      }
    }

    const {
      applicationId,
      status,
      call_id,
      interview_duration,
      recording_url,
      retell_llm_response_data
    } = body;

    console.log(
      `[set-application-status] Payload: AppId=${applicationId}, Status=${status}`
    );

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "Missing applicationId or status" },
        { status: 400 }
      );
    }

    let statusId = status;

    if (typeof status === "string") {
      const { data: statusData, error: statusError } = await supabase
        .from("application_statuses")
        .select("id")
        .eq("name", status)
        .single();

      if (statusData) {
        statusId = statusData.id;
      } else {
        console.warn(
          `Status name ${status} not found, trying to use as ID if number`
        );
      }
    }

    console.log(
      `[set-application-status] Updating app ${applicationId} to statusId ${statusId}`
    );

    const updatePayload: any = {
      status_id: statusId,
      updated_at: new Date().toISOString()
    };

    // Legacy String Status Mapping REMOVED because table schema changed.
    // UI derives strings from status_id in useApplicationRealtime.js now.

    if (call_id) updatePayload.call_id = call_id;
    if (interview_duration !== undefined)
      updatePayload.interview_duration = interview_duration;
    if (recording_url) updatePayload.recording_url = recording_url;
    if (retell_llm_response_data)
      updatePayload.retell_llm_response_data = retell_llm_response_data;

    console.log(`[set-application-status] Payload:`, updatePayload);

    const { data: updatedData, error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", applicationId)
      .select();

    if (error) {
      console.error("[set-application-status] DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedData || updatedData.length === 0) {
      console.error(
        "[set-application-status] NO ROWS UPDATED. Check ID or RLS."
      );
      return NextResponse.json(
        {
          error: "Update failed (No rows affected). check permissions/ID.",
          details: isServiceKey
            ? "Service Mode"
            : "User Session Mode (Check RLS)"
        },
        { status: 404 }
      );
    }

    console.log(
      "[set-application-status] Success. Rows updated:",
      updatedData.length
    );
    return NextResponse.json({ success: true, updated: updatedData });
  } catch (err: any) {
    console.error("[set-application-status] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
