import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Koçlarımız",
  description: "PerSe Coaching'deki uzman fitness koçlarını keşfedin. Hedeflerinize uygun koçunuzu bulun.",
};

export default function KocLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
