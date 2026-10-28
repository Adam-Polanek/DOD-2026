import type { Metadata } from "next";
import { Leaderboard } from "@/components/cil/Leaderboard";

export const metadata: Metadata = { title: "Žebříček DOD" };

export default function CilPage() {
  return <Leaderboard />;
}
