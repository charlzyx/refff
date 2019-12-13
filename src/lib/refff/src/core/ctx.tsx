import { FormConfig } from './Form';
import { createContext } from 'react';

export type Ctx = {
  data: object;
  fid: string;
  config: FormConfig;
};

export const Ctx = createContext<Ctx>({
  data: {},
  fid: '',
  config: {}
});

const { Provider, Consumer } = Ctx;

export { Provider, Consumer };
