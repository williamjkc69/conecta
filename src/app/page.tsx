import { Metadata } from "next";
import HomePageWrapper from "@/components/pages/HomePageWrapper";

export const metadata: Metadata = {
  title: "Home - Conecta",
  description: "AI Interview Platform"
};

export default function Page() {
  return <HomePageWrapper />;
}
