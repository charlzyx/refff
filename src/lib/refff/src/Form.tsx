import { Ctx, Provider } from './ctx';
import React, { FC, useEffect } from 'react';

import { FormProps } from '@refff/core';
import _ from 'lodash';
import { settings } from './settings';

export type FormConfig = {
  trigger?: 'onBlur' | 'onChange';
  editable?: boolean;
};
export type Props = {
  config?: FormConfig;
  ctx: Ctx;
} & FormProps;

const { UI } = settings;

export const Form: FC<Props> = ({ ctx, config, children }) => {
  useEffect(() => {
    if (config) {
      const isEqual = _.isEqual(ctx.config, config);
      if (!isEqual) {
        ctx.config = config;
      }
    }
  }, [config]);
  return (
    <Provider value={ctx}>
      <UI.Form>{children}</UI.Form>
    </Provider>
  );
};
