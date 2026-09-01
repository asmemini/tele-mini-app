import type { ButtonHTMLAttributes, ReactNode } from "react";

const primaryClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-button bg-brand px-5 text-[15px] font-semibold text-white shadow-glow transition-[transform,background-color] duration-150 touch-manipulation hover:bg-brand-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-60";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
};

export function PrimaryButton({
  children,
  className = "",
  type = "button",
  href,
  ...props
}: PrimaryButtonProps) {
  const classes = `${primaryClassName} ${className}`;
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
