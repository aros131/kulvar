import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "PerSe Coaching'e ücretsiz kayıt olun. Koç veya danışan olarak başlayın.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
