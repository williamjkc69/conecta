"use server";

import { createClient } from "@supabase/supabase-js";
import { verifyUserSession } from "@/lib/server-auth";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Core logic reuseable by both API Route (Webhook) and Server Action (Frontend)
export async function updateApplicationStatusLogic(
  data: any,
  isAdmin: boolean,
  sessionSupabase?: any
) {
  let supabase;

  if (isAdmin) {
    console.log("[set-application-status] Admin/Webhook Access");
    supabase = createClient(supabaseUrl, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } else {
    // User Session Mode
    console.log("[set-application-status] User Session Mode");
    if (sessionSupabase) {
      supabase = sessionSupabase;
    } else {
      // Fallback if no sessionSupabase passed, but we need session for RLS.
      // In Server Action, we verify session first and pass the client.
      throw new Error("Unauthorized: Missing session client");
    }
  }

  const {
    applicationId,
    status,
    call_id,
    interview_duration,
    recording_url,
    retell_llm_response_data
  } = data;

  console.log(
    `[set-application-status] Payload: AppId=${applicationId}, Status=${status}`
  );

  if (!applicationId || !status) {
    throw new Error("Missing applicationId or status");
  }

  let statusId = status;

  if (typeof status === "string") {
    // If status is string name, find ID
    // We need a client that can read application_statuses.
    // Both admin and authenticated user should be able to read this.
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

  // Check for expiration
  const { data: currentApp } = await supabase
    .from("applications")
    .select("expiration_date")
    .eq("id", applicationId)
    .single();

  if (currentApp && currentApp.expiration_date) {
    const isExpired = new Date(currentApp.expiration_date) < new Date();
    if (isExpired) {
      console.warn(
        `[set-application-status] Blocked update for expired application ${applicationId}`
      );
      throw new Error("Application execution period has expired.");
    }
  }

  const updatePayload: any = {
    status_id: statusId,
    updated_at: new Date().toISOString()
  };

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
    throw new Error(error.message);
  }

  if (!updatedData || updatedData.length === 0) {
    console.error("[set-application-status] NO ROWS UPDATED. Check ID or RLS.");
    throw new Error("Update failed (No rows affected). check permissions/ID.");
  }

  console.log(
    "[set-application-status] Success. Rows updated:",
    updatedData.length
  );
  return { success: true, updated: updatedData };
}

// Server Action for Frontend
export async function setApplicationStatusAction(data: any) {
  try {
    const session = await verifyUserSession();
    if (!session) {
      throw new Error("Unauthorized");
    }
    // Pass user's supabase client to enforce RLS
    return await updateApplicationStatusLogic(data, false, session.supabase);
  } catch (error) {
    console.error("[setApplicationStatusAction] Error:", error);
    throw error;
  }
}
