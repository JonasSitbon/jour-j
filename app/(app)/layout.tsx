import { AppShell } from "@/components/shell";
import { PageTransition } from "@/components/page-transition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
