import { ElementType, FC } from 'react';

import { Rule } from '@refff/core';
import { ValidateResult } from './ctx';

type UI = {
  Form: ElementType;
  Field: ElementType;
};

type Validator = (rule: Rule) => Promise<ValidateResult>;

const Empty: FC = () => null;

const settings: {
  UI: UI;
  validator: Validator;
} = {
  UI: {
    Form: Empty,
    Field: Empty
  },
  validator: rules => {
    if (!rules) return Promise.resolve('success');
    return Promise.reject('settings validator missed');
  }
};

const set = {
  UI: {
    Form(el: UI['Form']) {
      settings.UI.Form = el;
    },
    Field(el: UI['Field']) {
      settings.UI.Field = el;
    }
  },
  validator(fn: Validator) {
    settings.validator = fn;
  }
};

export { set, settings };
