import { Metadata } from "next";
import CandidateDashboard from "@/components/pages/CandidateDashboard";
import VerificationGuard from "@/components/auth/VerificationGuard";

export const metadata: Metadata = {
  title: "Candidate Dashboard - Conecta"
};

export default function Page() {
  return (
    <VerificationGuard>
      <CandidateDashboard />
    </VerificationGuard>
  );
}
