import { Metadata } from "next";
import InterviewPageWrapper from "@/components/pages/InterviewPageWrapper";

export const metadata: Metadata = {
  title: "Interview - Conecta"
};

export default function Page({
  params
}: {
  params: { applicationId: string };
}) {
  return <InterviewPageWrapper applicationId={params.applicationId} />;
}
