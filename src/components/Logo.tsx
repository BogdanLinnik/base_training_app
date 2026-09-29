/** Dumbbell mark from icon.svg next to a two-line "Base Training" wordmark (Base Training App). */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const large = size === "lg";
  return (
    <span className={`inline-flex items-center ${large ? "gap-3" : "gap-2"}`}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={`shrink-0 ${large ? "w-12 h-12" : "w-8 h-8"}`}
      >
        <rect width="64" height="64" rx="14" fill="#2563eb" />
        <g fill="#fff">
          <rect x="24" y="29" width="16" height="6" rx="1" />
          <rect x="16" y="20" width="8" height="24" rx="2.5" />
          <rect x="40" y="20" width="8" height="24" rx="2.5" />
          <rect x="9" y="25" width="7" height="14" rx="2" />
          <rect x="48" y="25" width="7" height="14" rx="2" />
        </g>
      </svg>
      <span className="flex flex-col text-left leading-none">
        <span
          className={`font-medium uppercase text-blue-600 ${
            large ? "text-xs tracking-[0.3em]" : "text-[10px] tracking-[0.3em]"
          }`}
        >
          Base
        </span>
        <span
          className={`font-bold uppercase text-gray-900 ${
            large ? "text-xl mt-1" : "text-sm mt-0.5"
          }`}
        >
          Training
        </span>
      </span>
    </span>
  );
}
