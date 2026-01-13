import { Switch } from '@mui/material';
import { useState } from 'react';

export function MuiSwitch(props: any) {
  const [checked, setChecked] = useState<boolean>(false);
  return (
    <div>
      <Switch aria-label="switch" checked={checked} onChange={(e) => setChecked(e.target.checked)} {...props} />
      <div aria-label="result">{checked ? 'on' : 'off'}</div>
    </div>
  );
}
