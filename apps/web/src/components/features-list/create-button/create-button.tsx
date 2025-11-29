import { Plus } from 'lucide-react';
import { Chip } from 'primereact/chip';
import { Panel } from 'primereact/panel';
import React from 'react';

export type CreateButtonProps = {
  onClick: () => void;
};

export function CreateButton({onClick}: CreateButtonProps) {
  return (
    <Panel role="button" className="w-full primary border-dashed" onClick={() => onClick()}>
      <div className="flex align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Chip className="tile tile-primary" icon={<Plus key="icon" size={24} />} />
          <h3 className="m-0 font-normal">Create a new test</h3>
        </div>
      </div>
    </Panel>
  );
}

export default CreateButton;
