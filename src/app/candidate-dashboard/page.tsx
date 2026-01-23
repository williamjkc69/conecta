import { Metadata } from "next";
import CandidateDashboard from "@/components/pages/CandidateDashboard";

export const metadata: Metadata = {
  title: "Candidate Dashboard - Conecta"
};

export default function Page() {
  return <CandidateDashboard />;
}
