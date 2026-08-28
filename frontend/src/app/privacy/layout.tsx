import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "PerSe Coaching gizlilik politikası — verilerinizi nasıl topladığımız ve koruduğumuz.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
