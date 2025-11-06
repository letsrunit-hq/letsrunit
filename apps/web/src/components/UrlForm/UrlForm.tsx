"use client";

import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

export type UrlFormProps = {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonLabel?: string;
  onSubmitUrl?: (url: string) => void;
};

function handleSubmit(
  e: React.FormEvent,
  url: string,
  onSubmitUrl?: (url: string) => void
) {
  e.preventDefault();
  if (onSubmitUrl) onSubmitUrl(url);
}

export function UrlForm({
  className,
  inputClassName,
  buttonClassName,
  placeholder = "https://www.example.com",
  buttonLabel = "Run it.",
  onSubmitUrl,
}: UrlFormProps) {
  const [url, setUrl] = useState("");

  return (
    <form
      className={className}
      onSubmit={(e) => handleSubmit(e, url, onSubmitUrl)}
      role="form"
      aria-label="run-url-form"
    >
      <InputText
        value={url}
        onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        aria-label="website-input"
        className={`p-inputtext-lg ${inputClassName ?? ""}`.trim()}
      />
      <Button type="submit" label={buttonLabel} className={buttonClassName} />
    </form>
  );
}

export default UrlForm;
