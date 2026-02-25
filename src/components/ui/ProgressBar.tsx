interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, label, color = 'var(--nhs-blue)', height = 'md' }: ProgressBarProps) {
  const heightClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-nhs-grey-1">{label}</span>
          <span className="font-semibold">{value.toFixed(1)}%</span>
        </div>
      )}
      <div className={`w-full bg-nhs-grey-4 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
