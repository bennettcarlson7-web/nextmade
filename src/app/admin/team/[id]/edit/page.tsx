import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { adminPhoto, readTeam } from "@/lib/data/team";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";
import { AdminLoading, AdminPage, Panel } from "@/components/admin/ui";
import { MemberForm } from "@/components/admin/member-form";

export const metadata = { title: "Edit team member" };

export default function EditMemberPage(props: PageProps<"/admin/team/[id]/edit">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditMember {...props} />
    </Suspense>
  );
}

async function EditMember({ params }: PageProps<"/admin/team/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const member = (await readTeam(createRedis(readIntakeEnv()))).find((m) => m.id === id);
  if (!member) notFound();

  return (
    <AdminPage title={`Edit: ${member.name}`} description="Changes appear on the About, Careers, and home pages within seconds.">
      <Panel className="max-w-3xl">
        <MemberForm
          id={member.id}
          values={{
            name: member.name,
            role: member.role,
            focus: member.focus,
            group: member.group,
            bio: member.bio ?? "",
            profileUrl: member.profileUrl ?? "",
            photo: adminPhoto(member.photo),
          }}
        />
      </Panel>
    </AdminPage>
  );
}
