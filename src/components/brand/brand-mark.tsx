type BrandMarkProps = {
  size?: "sm" | "md";
};

export function BrandMark({ size = "md" }: BrandMarkProps) {
  const boxClass =
    size === "sm" ? "h-14 w-14 rounded-[18px]" : "h-[88px] w-[88px] rounded-[28px]";
  const iconSize = size === "sm" ? 30 : 46;

  return (
    <div
      className={`flex items-center justify-center bg-brand shadow-[0_10px_24px_rgb(37_99_235_/_0.28)] ${boxClass}`}
      aria-hidden="true"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 46 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 18.5L23 10L38 18.5V33.5C38 35.1569 36.6569 36.5 35 36.5H11C9.34315 36.5 8 35.1569 8 33.5V18.5Z"
          fill="white"
          fillOpacity="0.22"
        />
        <path
          d="M8 18.5L23 10L38 18.5"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 22V32.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M23 22V32.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32 22V32.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        <path
          d="M8 18.5V33.5C8 35.1569 9.34315 36.5 11 36.5H35C36.6569 36.5 38 35.1569 38 33.5V18.5"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
