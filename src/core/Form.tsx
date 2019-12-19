import { FormConfig, FormProps } from '@refff/core';
import { Provider, TCtx } from './ctx';
import React, { FunctionComponent, MutableRefObject } from 'react';

import _ from 'lodash';
import { settings } from '../settings';

export type Props<T> = {
  config?: FormConfig;
  data: T & { __ctx: MutableRefObject<TCtx> };
} & FormProps;

const { UI } = settings.get();

interface IForm {
  <T extends object>(
    props: Parameters<FunctionComponent<Props<T>>>[0],
    contenxt: Parameters<FunctionComponent<Props<T>>>[1],
  ): ReturnType<FunctionComponent<Props<T>>>;
  displayName?: FunctionComponent<Props<any>>['displayName'];
}

const init = {};

export const Form: IForm = ({ data, config, children, ...others }) => {
  data.__ctx.current.config = config || init;
  return (
    <Provider value={data.__ctx.current}>
      <UI.Form {...others}>{children}</UI.Form>
    </Provider>
  );
};
