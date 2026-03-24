# Angular Zorro Compat Notes

This directory validates `setFieldValue` behavior against `ng-zorro-antd` components.

## Known Limitations

- `Nz Datepicker` (`date.spec.ts` `select date`) is skipped.
Reason: the component can echo typed text, but does not expose a stable generic composite signal that lets `setFieldValue` verify committed model state reliably.

- `Nz Range Picker` (`date.spec.ts` `select range`) is skipped.
Reason: the labeled range-group wrapper does not expose generic ARIA/date-group semantics, so the pipeline cannot route it before fallback.

## Scope Rule

Pipeline handlers must stay generic and framework-agnostic. We do not add `ng-zorro`-specific selectors/branches to support these controls.
