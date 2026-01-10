import { PrimeReactProvider } from 'primereact/api';
import { InputOtp, type InputOtpProps } from 'primereact/inputotp';
import { useState } from 'react';

export function PrimeReactOtp(props: InputOtpProps) {
  const [token, setToken] = useState<string | null>(null);

  return (
    <PrimeReactProvider>
      <div aria-label="result">{token}</div>
      <InputOtp value={token} onChange={(e) => setToken(e.value as string | null)} {...props} />;
    </PrimeReactProvider>
  );
}
