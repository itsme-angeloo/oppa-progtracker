import { cn } from "@/lib/utils";

export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("font-mono", className)}>{children}</span>;
}
