import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative rounded-md border border-border-subtle bg-bg-surface shadow-[0_8px_24px_rgb(0_0_0_/_0.22)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-border-subtle" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-border-subtle" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-border-subtle" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-border-subtle" />
      {children}
    </section>
  );
}
