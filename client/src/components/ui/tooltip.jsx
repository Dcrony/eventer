import { cn } from "../../lib/utils";

export default function Tooltip({ content, children, className }) {
  return (
    <span className={cn("ui-tooltip", className)}>
      {children}
      <span className="ui-tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
