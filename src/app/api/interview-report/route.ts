import { NextRequest } from "next/server";
import { interviewReport } from "@/lib/api/interviewReport";

export async function POST(request: NextRequest) {
  return await interviewReport(request);
}
