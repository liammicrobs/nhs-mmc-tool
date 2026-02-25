import { RAGStatus } from '@/types';

const RAG_STYLES: Record<RAGStatus, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-rag-green', text: 'text-white', label: 'GREEN' },
  amber: { bg: 'bg-rag-amber', text: 'text-nhs-black', label: 'AMBER' },
  red: { bg: 'bg-rag-red', text: 'text-white', label: 'RED' },
};

export function RAGBadge({ status, size = 'md' }: { status: RAGStatus; size?: 'sm' | 'md' | 'lg' }) {
  const style = RAG_STYLES[status];
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  return (
    <span className={`inline-flex items-center font-bold rounded ${style.bg} ${style.text} ${sizeClasses[size]}`}>
      {style.label}
    </span>
  );
}
