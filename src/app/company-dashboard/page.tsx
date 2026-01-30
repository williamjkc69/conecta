import { Metadata } from "next";
import CompanyDashboardWrapper from "@/components/pages/CompanyDashboardWrapper";
import VerificationGuard from "@/components/auth/VerificationGuard";

export const metadata: Metadata = {
  title: "Company Dashboard - Conecta"
};

export default function Page() {
  return (
    <VerificationGuard>
      <CompanyDashboardWrapper />
    </VerificationGuard>
  );
}
