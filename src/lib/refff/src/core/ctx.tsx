import { MutableRefObject, createContext } from 'react';

import { FormConfig } from '@refff/core';

export type TCtx = {
  data: MutableRefObject<object>;
  fid: string;
  config: FormConfig;
};

export const Ctx = createContext<TCtx>({
  data: { current: {} },
  fid: '',
  config: {}
});

const { Provider, Consumer } = Ctx;

export { Provider, Consumer };
