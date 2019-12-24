import { FormConfig, FormProps } from '@refff/core';
import { Provider, TCtx } from './ctx';
import React, { FC, MutableRefObject } from 'react';

import { settings } from '../settings';

export type Props<T = object> = {
  config?: FormConfig;
  data: T & { __ctx: MutableRefObject<TCtx> };
} & FormProps;

const { UI } = settings.get();

interface IForm {}

const init = {};

export const Form: FC<Props> & IForm = ({
  data,
  config,
  children,
  ...others
}) => {
  data.__ctx.current.config = config || init;
  return (
    <Provider value={data.__ctx.current}>
      <UI.Form {...others}>{children}</UI.Form>
    </Provider>
  );
};
