import React, { createContext, useContext } from 'react';
import { noop, noopnoop } from './utils';

import { FormConfig } from './Form';
import { Patch } from 'immer';

type autoDisposer = () => void;
export type ValidateStatus =
  | 'init'
  | 'validating'
  | 'success'
  | 'error'
  | 'timeout';

export const Events = (fid: string) => ({
  change: fid + '_change',
  reset: fid + '_reset',
  clean: fid + '_clean',
  validate: fid + '_validate',
  mounted: fid + '_mounted',
  unmounted: fid + '_unmounted'
});
// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace Event {
  type change = (event: {
    value: any;
    path: string | Patch['path'];
    source: string;
  }) => void;
  type reset = (event: { path?: string }) => void;
  /** clean validate */
  type clean = (event: { path?: string }) => void;
  /** TODO: validate 的 event 不知道应该包含什么 */
  type validate = (event: { vid: string; status: ValidateStatus }) => void;
  /** 成功总是会返回 promise, 报错会在 catch 里面取 Error.message */
  type validator = () => Promise<string | void>;
  type mounted = (event: {
    vid: string;
    path: string;
    checker: validator;
  }) => void;
  type unmounted = (event: { vid: string }) => void;
}

export type Ctx<T extends object = Record<string, any>> = {
  data: T;
  fid: string;
  config: FormConfig;
  actions: {
    on: {
      change: (fn: Event.change) => autoDisposer;
      reset: (fn: Event.reset) => autoDisposer;
      clean: (fn: Event.clean) => autoDisposer;
      validate: (fn: Event.validate) => autoDisposer;
      mounted: (fn: Event.mounted) => autoDisposer;
      unmounted: (fn: Event.unmounted) => autoDisposer;
    };
    emit: {
      change: Event.change;
      reset: Event.reset;
      clean: Event.clean;
      validate: Event.validate;
      mounted: Event.mounted;
      unmounted: Event.unmounted;
    };
  };
};

export const Ctx = createContext<Ctx>({
  data: {},
  fid: '',
  config: {},
  actions: {
    on: {
      change: noopnoop,
      reset: noopnoop,
      validate: noopnoop,
      clean: noopnoop,
      mounted: noopnoop,
      unmounted: noopnoop
    },
    emit: {
      change: noop,
      reset: noop,
      validate: noop,
      clean: noop,
      mounted: noop,
      unmounted: noop
    }
  }
});

const { Provider, Consumer } = Ctx;

export { Provider, Consumer };
