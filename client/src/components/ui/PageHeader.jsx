import { cn } from "../../lib/utils";

export default function PageHeader({ title, description, actions, className }) {
  if (!title && !description && !actions) return null;

  return (
    <header className={cn("page-header flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {title && (
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        )}
        {description && <p className="mt-1.5 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
