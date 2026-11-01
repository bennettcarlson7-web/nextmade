import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/session";
import { AdminLoading, AdminPage, Panel } from "@/components/admin/ui";
import { MemberForm } from "@/components/admin/member-form";

export const metadata = { title: "Add team member" };

export default function NewMemberPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewMember />
    </Suspense>
  );
}

async function NewMember() {
  await requireAdmin();
  return (
    <AdminPage title="Add team member" description="Add someone's profile and photo. Only publish details they've approved.">
      <Panel className="max-w-3xl">
        <MemberForm id={null} values={{ name: "", role: "", focus: "", group: "engineering", bio: "", profileUrl: "", photo: null }} />
      </Panel>
    </AdminPage>
  );
}
