import { cn } from "../../lib/utils";
import PageHeader from "../ui/PageHeader";

/**
 * Standard authenticated page shell. Sidebar offset lives on <main> in App.jsx only.
 */
export default function AppPage({
  children,
  title,
  description,
  actions,
  className,
  contentClassName,
  fullWidth = false,
  noPadding = false,
  background = "bg-gray-50",
}) {
  return (
    <div className={cn("min-h-full w-full font-geist", background, className)}>
      <div
        className={cn(
          fullWidth ? "w-full" : "page-container max-w-7xl mx-auto",
          !noPadding && "py-6",
          contentClassName,
        )}
      >
        {(title || description || actions) && (
          <PageHeader title={title} description={description} actions={actions} />
        )}
        {children}
      </div>
    </div>
  );
}
