import { ElementType, FC, MutableRefObject } from 'react';
import { FieldMapping, PipeConfig, Rule } from '@refff/core';

type UI = {
  Form: ElementType;
  Field: ElementType;
  Notice: ElementType;
};

type Validator = (
  value: MutableRefObject<any>,
  rule: Rule,
  label?: string
) => string | void | Promise<string | void>;

const Empty: FC = () => null;

const config: {
  UI: UI;
  validator: Validator;
  pipe: Required<PipeConfig>;
  map: Required<FieldMapping>;
} = {
  UI: {
    Form: Empty,
    Field: Empty,
    Notice: Empty
  },
  validator: rules => {
    if (!rules) return;
    throw new Error('settings.validator missed');
  },
  pipe: { to: [], by: [], order: ['default', 'static', 'props'] },
  map: {
    value: 'value',
    onChange: 'onChange',
    onBlur: 'onBlur',
    editable: 'editable',
    valid: 'valid',
    help: 'help'
  }
};

export type LinkConfig = {
  pipe?: typeof config['pipe'];
  map?: typeof config['map'];
};

const link = <T extends ElementType>(
  el: T & LinkConfig,
  conf?: LinkConfig
): T & Readonly<LinkConfig> => {
  if (conf?.map) {
    el.map = conf.map;
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
    Notice: (el: Config['UI']['Notice']) => (config.UI.Notice = el)
  },
  validator: (v: Config['validator']) => (config.validator = v),
  pipe: (p: Config['pipe']) => (config.pipe = p),
  map: (m: Config['map']) => (config.map = m)
};

const settings = { get: () => config, set };

export { settings, link };
