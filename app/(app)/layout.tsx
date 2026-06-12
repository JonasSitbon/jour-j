import { AppShell } from "@/components/shell";
import { PageTransition } from "@/components/page-transition";
import { RealtimeSync } from "@/components/realtime-sync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <RealtimeSync />
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
