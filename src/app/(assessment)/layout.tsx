import { LayoutShell } from '@/components/layout/LayoutShell';
import { InstallBanner } from '@/components/ui/InstallBanner';

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutShell>{children}</LayoutShell>
      <InstallBanner />
    </>
  );
}
