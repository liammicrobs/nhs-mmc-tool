interface PageHeaderProps {
  stepNumber: number | string;
  title: string;
  description: string;
}

export function PageHeader({ stepNumber, title, description }: PageHeaderProps) {
  const isString = typeof stepNumber === 'string';

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`${
            isString ? 'px-3 py-1 rounded-lg text-sm' : 'w-10 h-10 rounded-full text-lg'
          } bg-nhs-blue text-white flex items-center justify-center font-bold`}
        >
          {stepNumber}
        </span>
        <h1 className="text-2xl font-bold text-nhs-black">{title}</h1>
      </div>
      <p className="text-nhs-grey-1 ml-[52px]">{description}</p>
    </div>
  );
}
