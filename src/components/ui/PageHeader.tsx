interface PageHeaderProps {
  stepNumber: number;
  title: string;
  description: string;
}

export function PageHeader({ stepNumber, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-full bg-nhs-blue text-white flex items-center justify-center font-bold text-lg">
          {stepNumber}
        </span>
        <h1 className="text-2xl font-bold text-nhs-black">{title}</h1>
      </div>
      <p className="text-nhs-grey-1 ml-[52px]">{description}</p>
    </div>
  );
}
