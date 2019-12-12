import { ElementType, FC, MutableRefObject } from 'react';
import { Rule, ValidateStatus } from '@refff/core';

import { getEventValue } from './helpers';

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
    return oc(getEventValue(v));
  };
  return {
    ...props,
    ...overrides,
    onChange
  };
};

export type Link = typeof link;

type UI = {
  Form: ElementType;
  Field: ElementType;
};

type Validator = (
  value: MutableRefObject<any>,
  rule: Rule,
  label?: string
) => string | void | Promise<string | void>;

const Empty: FC = () => null;

const settings: {
  UI: UI;
  validator: Validator;
  link: Link;
} = {
  UI: {
    Form: Empty,
    Field: Empty
  },
  validator: rules => {
    if (!rules) return;
    throw new Error('settings.validator missed');
  },
  link: link
};

export { settings };
