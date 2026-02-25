interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function SectionCard({ title, subtitle, children, headerRight }: SectionCardProps) {
  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50">
        <div>
          <h2 className="text-lg font-bold text-nhs-black">{title}</h2>
          {subtitle && <p className="text-sm text-nhs-grey-1 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
