import Image from "next/image";
import { cn } from "@/lib/utils";

const PRESETS = {
  sm: { wh: 32, className: "h-8 w-8" },
  md: { wh: 56, className: "h-14 w-14" },
} as const;

type Size = keyof typeof PRESETS;

export function BrandLogo({
  size = "md",
  className,
  priority,
}: {
  size?: Size;
  className?: string;
  /** Set for above-the-fold hero / login */
  priority?: boolean;
}) {
  const p = PRESETS[size];
  return (
    <Image
      src="/councilLogo.png"
      alt="Prompt Odyssey"
      width={p.wh}
      height={p.wh}
      priority={priority}
      className={cn(
        "shrink-0 rounded-full object-cover object-center ring-1 ring-black/[0.06] dark:ring-white/10",
        p.className,
        className,
      )}
    />
  );
}
