import { MutableRefObject, createContext } from 'react';

import { FormConfig } from '@refff/core';

export type Ctx = {
  data: MutableRefObject<object>;
  fid: string;
  config: FormConfig;
};

export const Ctx = createContext<Ctx>({
  data: { current: {} },
  fid: '',
  config: {}
});

const { Provider, Consumer } = Ctx;

export { Provider, Consumer };
