"use client";

import Link from "next/link";

type ScrollToTopLinkProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
};

export function ScrollToTopLink({ children, className, ariaLabel }: ScrollToTopLinkProps) {
  return (
    <Link
      href="/"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
