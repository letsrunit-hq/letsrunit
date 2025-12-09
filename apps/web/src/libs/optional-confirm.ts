import type { RequireOnly } from '@letsrunit/utils';
import { confirmDialog, type ConfirmDialogProps } from 'primereact/confirmdialog';

type OptionalConfirmProps = RequireOnly<ConfirmDialogProps, 'accept'> & { autoAccept?: boolean };

export function optionalConfirm(props: OptionalConfirmProps): void {
  if (props.autoAccept) {
    props.accept();
    return;
  }

  confirmDialog(props);
}
