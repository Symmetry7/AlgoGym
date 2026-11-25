import type { Metadata } from "next";
import Pricing from "@/screens/Pricing";

export const metadata: Metadata = {
  title: "Plans | AlgoGym",
  description: "Compare the planned AlgoGym Free, Pro, and Premium learning plans.",
};

export default function PricingPage() {
  return <Pricing />;
}
