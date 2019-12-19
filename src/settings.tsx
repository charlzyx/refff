import { ElementType, FC, MutableRefObject } from 'react';
import { Rule, TFieldMeta, TPipeConfig } from '@refff/core';

type UI = {
  Form: ElementType;
  Field: ElementType;
  Notice: ElementType;
};

type Validator = (
  value: MutableRefObject<any>,
  rule: Rule,
  label?: string,
) => string | void | Promise<string | void>;

const Empty: FC = () => null;

const config: {
  UI: UI;
  validator: Validator;
  pipe: Required<TPipeConfig>;
  meta: {
    child: Required<TFieldMeta['child']>;
    field: Required<TFieldMeta['field']>;
  };
} = {
  UI: {
    Form: Empty,
    Field: Empty,
    Notice: Empty,
  },
  validator: (rules) => {
    if (!rules) {
      return;
    }
    throw new Error('settings.validator missed');
  },
  pipe: { v2c: [], c2v: [], order: ['default', 'static', 'props'] },
  meta: {
    child: {
      value: 'value',
      onChange: 'onChange',
      onBlur: 'onBlur',
      disabled: 'disabled',
      valid: 'valid',
      help: 'help',
    },
    field: {
      disabled: 'disabled',
      valid: 'valid',
      help: 'help',
    },
  },
};

export type LinkConfig = {
  pipe?: Partial<typeof config['pipe']>;
  meta?: Partial<typeof config['meta']>;
};

const link = <T extends ElementType>(
  el: T & LinkConfig,
  conf?: LinkConfig,
): T & Readonly<LinkConfig> => {
  if (conf?.meta) {
    el.meta = conf.meta;
  }
  if (conf?.pipe) {
    el.pipe = conf.pipe;
  }
  return el;
};

type Config = typeof config;

const set = {
  UI: {
    Form: (el: Config['UI']['Form']) => (config.UI.Form = el),
    Field: (el: Config['UI']['Field']) => (config.UI.Field = el),
    Notice: (el: Config['UI']['Notice']) => (config.UI.Notice = el),
  },
  validator: (v: Config['validator']) => {
    config.validator = v;
    console.log('afterconfig', config);
  },
  pipe: (p: Config['pipe']) => (config.pipe = p),
  meta: (m: Config['meta']) => (config.meta = m),
};

const settings = {
  get: () => {
    return config;
  },
  set,
};

export { settings, link };
