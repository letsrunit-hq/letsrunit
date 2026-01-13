import { Slider } from '@mui/material';
import { useState } from 'react';

export function MuiSlider(props: any) {
  const [value, setValue] = useState(20);
  return (
    <div>
      <Slider aria-label="slider" min={0} max={100} onChange={(_, newValue) => setValue(newValue)} {...props} />
      <div aria-label="result">{value}</div>
    </div>
  );
}
