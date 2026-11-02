import { PersonalSubnav } from "@/frontend/admin/personal-subnav";

export default function PersonalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-6">
      <PersonalSubnav />
      {children}
    </div>
  );
}
