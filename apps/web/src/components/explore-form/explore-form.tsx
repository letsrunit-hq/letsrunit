'use client';

import { startExploreRun } from '@/actions/explore';
import { useToast } from '@/context/toast-context';
import { ensureSignedIn } from '@/libs/auth';
import { cn } from '@letsrunit/utils';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useCallback, useState } from 'react';

export type UrlFormProps = {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonLabel?: string;
};

function handleSubmit(e: React.FormEvent, onSubmitUrl?: () => void) {
  e.preventDefault();
  if (onSubmitUrl) void onSubmitUrl();
}

export function ExploreForm({
  className,
  inputClassName,
  buttonClassName,
  placeholder = 'https://www.example.com',
  buttonLabel = 'Run it.',
}: UrlFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = url.match(/^(https?:\/\/)?([\w\-]+\.[\w\-]+|localhost)/);

  const onSubmitUrl = useCallback(async () => {
    if (!isValid) return;

    try {
      setIsSubmitting(true);
      await ensureSignedIn();

      // TODO: Check if there's already a project for the URL; if so go to the project

      const runId = await startExploreRun(url);
      router.push(`/runs/${runId}`);
    } catch (e) {
      toast.show({
        severity: 'error',
        summary: 'Error',
        detail: e instanceof Error ? e.message : 'An error occurred while starting the run',
        life: 5000,
      });
    } finally {
      // If navigation happens, component may unmount; this is safe.
      setTimeout(() => void setIsSubmitting(false), 5000);
    }
  }, [router, url, isValid]);

  return (
    <form className={className} onSubmit={(e) => handleSubmit(e, onSubmitUrl)} role="form" aria-label="run-url-form">
      <InputText
        value={url}
        onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        aria-label="website-input"
        className={cn('p-inputtext-lg', inputClassName)}
        disabled={isSubmitting}
        invalid={url !== '' && !isValid}
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
