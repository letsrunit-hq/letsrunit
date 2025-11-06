"use client";

import React from "react";
import { Button } from "primereact/button";

export type BackToTopButtonProps = {
  className?: string;
  label?: string;
  ariaLabel?: string;
  icon?: string;
};

function scrollTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function BackToTopButton({ className, label = "Back to top", ariaLabel = "Back to top", icon = "pi pi-arrow-up" }: BackToTopButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      label={label}
      icon={icon}
      onClick={scrollTop}
      className={className}
    />
  );
}

export default BackToTopButton;
