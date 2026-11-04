import { requireMemberPageSession } from "@/lib/auth";
import { getMemberPortalData } from "@/lib/db";
import WargaShell from "@/components/warga-shell";
export const instant=false;
export default async function WargaLayout({children}:{children:React.ReactNode}){const session=await requireMemberPageSession();const data=await getMemberPortalData(session.memberId);const member=data.member as {name:string;member_code:string};return <WargaShell name={member.name} code={member.member_code}>{children}</WargaShell>;}
