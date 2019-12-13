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

const settings: {
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
  pipe?: typeof settings['pipe'];
  map?: typeof settings['map'];
};

const link = <T extends ElementType>(
  el: T & LinkConfig,
  config?: LinkConfig
): T & Readonly<LinkConfig> => {
  if (config?.map) {
    el.map = config.map;
  }
  if (config?.pipe) {
    el.pipe = config.pipe;
  }
  return el;
};

export { settings, link };
