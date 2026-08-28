import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description: "PerSe Coaching ile iletişime geçin. Sorularınız için buradayız.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
