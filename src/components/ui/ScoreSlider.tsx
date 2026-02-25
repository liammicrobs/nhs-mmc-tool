'use client';

interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  showValue?: boolean;
  colorMode?: 'benefit' | 'constraint' | 'neutral';
}

function getSliderColor(value: number, max: number, mode: string): string {
  const pct = value / max;
  if (mode === 'constraint') {
    if (pct <= 0.3) return 'var(--rag-green)';
    if (pct <= 0.7) return 'var(--rag-amber)';
    return 'var(--rag-red)';
  }
  if (mode === 'benefit') {
    if (pct <= 0.3) return 'var(--rag-red)';
    if (pct <= 0.7) return 'var(--rag-amber)';
    return 'var(--rag-green)';
  }
  return 'var(--nhs-blue)';
}

export function ScoreSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  leftLabel,
  rightLabel,
  showValue = true,
  colorMode = 'neutral',
}: ScoreSliderProps) {
  const color = getSliderColor(value, max, colorMode);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        {leftLabel && <span className="text-xs text-nhs-grey-1 whitespace-nowrap">{leftLabel}</span>}
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, var(--nhs-grey-4) ${percentage}%, var(--nhs-grey-4) 100%)`,
            }}
          />
        </div>
        {rightLabel && <span className="text-xs text-nhs-grey-1 whitespace-nowrap">{rightLabel}</span>}
        {showValue && (
          <span className="w-8 text-center font-bold text-sm" style={{ color }}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
