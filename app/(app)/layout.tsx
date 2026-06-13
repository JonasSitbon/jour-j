import { AppShell } from "@/components/shell";
import { PageTransition } from "@/components/page-transition";
import { RealtimeSync } from "@/components/realtime-sync";
import { RoleGuard } from "@/components/role-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <RealtimeSync />
      <RoleGuard>
        <PageTransition>{children}</PageTransition>
      </RoleGuard>
    </AppShell>
  );
}
