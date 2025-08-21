// src/app/dashboard/user/koclarimiz/page.tsx
import UserNavbar from "@/components/nav/UserNavbar";
import CoachesPageBody from "@/components/CoachesPageBody";

export default function DashboardKoclarimizPage() {
  return (
    <div className="min-h-screen">
      <UserNavbar />
      <CoachesPageBody
        basePath="/dashboard/user/koclarimiz"
        profilePrefix="/uye/koc"
      />
    </div>
  );
}
