import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  return {
    title: t("kocTitle"),
    description: t("kocDescription"),
  };
}

export default function KocLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
