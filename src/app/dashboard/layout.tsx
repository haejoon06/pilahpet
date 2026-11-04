import AdminShell from "@/components/admin-shell";
import { requirePageSession } from "@/lib/auth";
export const instant=false;

export default async function DashboardLayout({children}:{children:React.ReactNode}){
  const session=await requirePageSession();
  return <AdminShell role={session.role}>{children}</AdminShell>;
}
