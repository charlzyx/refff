import { ValidateStatus } from './ctx';
import { getEventValue } from './utils';

type Overrides<T> = {
  value: T;
  onChange: (v: T) => T;
  onBlur: <E extends any>(e: E) => E;
  editable: boolean | undefined;
  valid: ValidateStatus;
  help: string;
};

export const link = <
  T extends any = any,
  P extends object = Record<string, any>
>(
  props: P,
  overrides: Overrides<T>
) => {
  const oc = overrides.onChange;
  const onChange = (v: any) => {
    oc(getEventValue(v));
  };
  return {
    ...props,
    ...overrides,
    onChange
  };
};

export type Link = typeof link;
