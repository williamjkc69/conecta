import { Metadata } from "next";
import CompanyDashboardWrapper from "@/components/pages/CompanyDashboardWrapper";

export const metadata: Metadata = {
  title: "Company Dashboard - Conecta"
};

export default function Page() {
  return <CompanyDashboardWrapper />;
}
