"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "primereact/button";

export type ScrollDownButtonProps = {
  className?: string;
  targetId?: string;
  ariaLabel?: string;
};

function scrollToElementById(id: string) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleScrollDownClick(e: React.MouseEvent<HTMLButtonElement>) {
  const target = e.currentTarget.getAttribute("data-target-id") || "learn-more";
  scrollToElementById(target);
}

export function ScrollDownButton({ className, targetId = "learn-more", ariaLabel = "Scroll to learn more" }: ScrollDownButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      icon={<ChevronDown aria-hidden="true" />}
      className={className}
      onClick={handleScrollDownClick}
      data-target-id={targetId}
    />
  );
}

export default ScrollDownButton;
