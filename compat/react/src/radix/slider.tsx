import * as Slider from '@radix-ui/react-slider';
import { useState } from 'react';

export function RadixSlider() {
  const [value, setValue] = useState([50]);
  return (
    <div>
      <Slider.Root aria-label="volume" min={0} max={100} value={value} onValueChange={setValue}>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb aria-label="volume" />
      </Slider.Root>
      <div aria-label="result">{value[0]}</div>
    </div>
  );
}
