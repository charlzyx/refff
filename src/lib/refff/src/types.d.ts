/* eslint-disable @typescript-eslint/no-empty-interface */
export declare module '@refff/core' {
  export interface Rule {}
  export interface FormProps {}
  export interface FiledProps {}
  export interface NoticeProps {}
  export type ValidateStatus =
    | 'init'
    | 'validating'
    | 'success'
    | 'error'
    | 'timeout';
  export declare namespace Event {
    type change = (event: {
      value: any;
      path: string | number | (string | number)[];
      source: string;
    }) => void;
    type reset = (event: { path?: string }) => void;
    /** clean validate */
    type clean = (event: { path?: string }) => void;
    type validate = (event: { vid: string; status: ValidateStatus }) => void;
    /** 通过走 .then, 报错在 .catch 里面取 Error.message */
    type validator = () => Promise<string | void>;
    type mounted = (event: {
      vid: string;
      path: string;
      checker: validator;
    }) => void;
    type unmounted = (event: { vid: string }) => void;
  }
  export type Events = {
    on: {
      debug: (fn: (...args: any[]) => void) => void;
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
}
