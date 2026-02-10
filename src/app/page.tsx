import { Metadata } from "next";
import HomePageWrapper from "@/components/pages/HomePageWrapper";
import { LANDING_HERO } from "@/constants/landing";

export const metadata: Metadata = {
  title: "Home - Conecta",
  description: LANDING_HERO.DESCRIPTION
};

export default function Page() {
  return <HomePageWrapper />;
}
