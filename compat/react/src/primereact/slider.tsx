import { PrimeReactProvider } from 'primereact/api';
import { Slider, type SliderProps } from 'primereact/slider';
import { useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';

export function PrimeReactSlider(props: SliderProps) {
  const [token, setToken] = useState<number>(50);

  return (
    <PrimeReactProvider>
      <div aria-label="result">{token}</div>
      <Slider value={token} min={0} max={100} onChange={(e) => setToken(e.value as number)} {...props} />;
    </PrimeReactProvider>
  );
}
