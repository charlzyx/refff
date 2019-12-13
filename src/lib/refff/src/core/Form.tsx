import { Ctx, Provider } from './ctx';
import { FormConfig, FormProps } from '@refff/core';
import React, { FunctionComponent, MutableRefObject, useEffect } from 'react';

import _ from 'lodash';
import { settings } from '../settings';

export type Props<T> = {
  config?: FormConfig;
  data: T & { __ctx: MutableRefObject<Ctx> };
} & FormProps;

const { UI } = settings.get();

interface IForm {
  <T extends object>(
    props: Parameters<FunctionComponent<Props<T>>>[0],
    contenxt: Parameters<FunctionComponent<Props<T>>>[1]
  ): ReturnType<FunctionComponent<Props<T>>>;
  displayName?: FunctionComponent<Props<any>>['displayName'];
}

export const Form: IForm = ({ data, config, children }) => {
  useEffect(() => {
    if (config) {
      const isEqual = _.isEqual(data.__ctx.current.config, config);
      if (!isEqual) {
        data.__ctx.current.config = config;
      }
    }
  }, [config]);
  return (
    <Provider value={data.__ctx.current}>
      <UI.Form>{children}</UI.Form>
    </Provider>
  );
};
