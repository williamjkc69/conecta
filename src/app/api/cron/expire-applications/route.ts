import { NextRequest, NextResponse } from "next/server";
import { expireApplications } from "@/lib/api/expireApplications";

export async function GET(req: NextRequest) {
  return await expireApplications(req);
}
