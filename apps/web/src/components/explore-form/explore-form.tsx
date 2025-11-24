'use client';

import React, { useCallback, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { startExploreRun } from '@/actions/explore';
import { useRouter } from 'next/navigation';
import { ensureSignedIn } from '@/libs/auth';
import { cn } from '@letsrunit/utils';

export type UrlFormProps = {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonLabel?: string;
};

function handleSubmit(e: React.FormEvent, onSubmitUrl?: () => void) {
  e.preventDefault();
  if (onSubmitUrl) onSubmitUrl();
}

export function ExploreForm({
  className,
  inputClassName,
  buttonClassName,
  placeholder = 'https://www.example.com',
  buttonLabel = 'Run it.',
}: UrlFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState('http://localhost:8080');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitUrl = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await ensureSignedIn();
      const runId = await startExploreRun(url);
      router.push(`/runs/${runId}`);
    } finally {
      // If navigation happens, component may unmount; this is safe.
      setTimeout(() => {
        setIsSubmitting(false);
      }, 5000);
    }
  }, [router, url]);

  return (
    <form className={className} onSubmit={(e) => handleSubmit(e, onSubmitUrl)} role="form" aria-label="run-url-form">
      <InputText
        value={url}
        onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        aria-label="website-input"
        className={cn('p-inputtext-lg', inputClassName)}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        label={buttonLabel}
        size="large"
        className={buttonClassName}
        disabled={isSubmitting}
        loading={isSubmitting}
      />
    </form>
  );
}

export default ExploreForm;
