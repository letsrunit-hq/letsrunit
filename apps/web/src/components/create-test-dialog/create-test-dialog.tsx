import { cn } from '@letsrunit/utils';
import { Zap } from 'lucide-react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import React, { useState } from 'react';
import styles from './create-test-dialog.module.css';

export type CreateTestDialogValues = {
  path: string;
  description: string;
};

export type CreateTestDialogProps = {
  className?: string;
  visible: boolean;
  baseUrl?: string;
  cancel: () => void;
  generate: (values: CreateTestDialogValues) => void;
};

export function CreateTestDialog({ className, visible, baseUrl, cancel, generate }: CreateTestDialogProps) {
  const [startPath, setStartPath] = useState('');
  const [instructions, setInstructions] = useState('');

  const footer = (
    <div className="flex align-items-center justify-content-end gap-2 w-full">
      <Button label="Cancel" text severity="secondary" onClick={cancel} />
      <Button
        label="Generate"
        icon={<Zap size={16} className="mr-2" />}
        onClick={() => generate({ path: startPath, description: instructions })}
        disabled={instructions.trim().length === 0}
      />
    </div>
  );

  return (
    <Dialog
      header="Create a new test"
      className={cn(className, styles.dialog)}
      visible={visible}
      onHide={cancel}
      footer={footer}
      dismissableMask
      modal
    >
      <div className="flex flex-column gap-3">
        <div className="flex flex-column gap-2">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">{baseUrl}/</span>
            <InputText id="start-page" value={startPath} onChange={(e) => setStartPath(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-column gap-2">
          <InputTextarea
            id="instructions"
            placeholder="What do you want to test?"
            autoResize
            rows={8}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default CreateTestDialog;
