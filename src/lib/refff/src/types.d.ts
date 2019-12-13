/* eslint-disable @typescript-eslint/no-empty-interface */
export declare module '@refff/core' {
  export interface Rule {}
  export interface FormProps {}
  export interface FieldProps {}
  export interface NoticeProps {}
  export type ValidateStatus =
    | 'init'
    | 'validating'
    | 'success'
    | 'error'
    | 'timeout';
  export namespace Event {
    /** 外部调用 重置表单数据 */
    type reset = (event: { path?: string }) => void;
    /** Filed -> useForm 主动校验 */
    type validate = (event: { vid: string; status: ValidateStatus }) => void;
    /** 外部调用 clean validate */
    type clean = (event: { path?: string }) => void;
    /** 外部调用 通过走 .then, 报错在 .catch 里面取 Error.message */
    type validator = () => Promise<string | void>;
    /** Field <-> useForm 双向数据变更 */
    type change = (event: {
      value: any;
      path: string | number | (string | number)[];
      source: string;
    }) => void;
    /** Filed -> useForm 挂载 */
    type mounted = (event: {
      vid: string;
      path: string;
      checker: validator;
    }) => void;
    /** Filed -> useForm 卸载 */
    type unmounted = (event: { vid: string }) => void;
  }

  type Disposer = () => void;

  export interface Events {
    on: {
      debug: (fn: (type: any, e: any) => void) => void;
      change: (fn: Event.change) => Disposer;
      reset: (fn: Event.reset) => Disposer;
      clean: (fn: Event.clean) => Disposer;
      validate: (fn: Event.validate) => Disposer;
      mounted: (fn: Event.mounted) => Disposer;
      unmounted: (fn: Event.unmounted) => Disposer;
    };
    emit: {
      change: Event.change;
      reset: Event.reset;
      clean: Event.clean;
      validate: Event.validate;
      mounted: Event.mounted;
      unmounted: Event.unmounted;
    };
  }

  export type FieldMapping = {
    value?: string;
    onChange?: string;
    onBlur?: string;
    editable?: string;
    valid?: string;
    help?: string;
  };
  export type Pipe = (value: any) => any;
  export type Combin<T1, T2, T3> =
    | []
    | [T1]
    | [T2]
    | [T3]
    | [T1, T2]
    | [T2, T1]
    | [T1, T3]
    | [T3, T1]
    | [T2, T3]
    | [T3, T2]
    | [T1, T2, T3]
    | [T1, T3, T2]
    | [T2, T3, T1]
    | [T2, T1, T3]
    | [T3, T1, T2]
    | [T3, T2, T1];

  export type PipeOrder = Combin<'default', 'static', 'props'>;
  export type PipeConfig = {
    to?: Pipe[];
    by?: Pipe[];
    order?: PipeOrder;
  };

  export type FormConfig = {
    trigger?: 'onBlur' | 'onChange';
    editable?: boolean;
  };

  export type DeepReadonly<T> = {
    [P in keyof T]: DeepReadonly<T[P]>;
  };
}
