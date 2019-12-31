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
    type reset = (event: {
      path?: string;
      replaced: boolean;
      withValid?: boolean;
    }) => void;
    /** Filed -> useForm 主动校验 */
    type validate = (event: { vid: string; status: ValidateStatus }) => void;
    /** 外部调用 clean validate */
    type clean = (event: { path?: string }) => void;
    /** 外部调用 通过走 .then, 报错在 .catch 里面取 Error.message */
    type validator = () => Promise<string | void>;
    /** Field <-> useForm 双向数据变更 */
    type change = (event: {
      next: any;
      path: Path | Path[];
      source: string;
    }) => void;
    /** Form -> Field, 不同步的数据 */
    type init = (event: { next: any }) => void;
    /** Field -> useForm 挂载 */
    type mounted = (event: {
      vid: string;
      path: string;
      checker: validator;
      validStatus: ValidateStatus | undefined;
    }) => void;
    /** Filed -> useForm 卸载 */
    type unmounted = (event: { vid: string }) => void;
  }

  type Disposer = () => void;

  export interface Events {
    on: {
      all: (fn: (type: any, e: any) => void) => void;
      change: (fn: Event.change) => Disposer;
      reset: (fn: Event.reset) => Disposer;
      clean: (fn: Event.clean) => Disposer;
      validate: (fn: Event.validate) => Disposer;
      init: (fn: Event.init) => Disposer;
      mounted: (fn: Event.mounted) => Disposer;
      unmounted: (fn: Event.unmounted) => Disposer;
    };
    emit: {
      change: Event.change;
      reset: Event.reset;
      clean: Event.clean;
      validate: Event.validate;
      init: Event.init;
      mounted: Event.mounted;
      unmounted: Event.unmounted;
    };
  }

  export type TFieldMeta = {
    child: {
      value?: string;
      onChange?: string;
      onBlur?: string;
      disabled?: string;
      valid?: string;
      help?: string;
    };
    field: {
      disabled?: string;
      valid?: string;
      help?: string;
    };
  };
  export type Pipe = (value: any, props: any) => any;
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

  export type TPipeOrder = Combin<'default', 'static', 'props'>;
  export type TPipeConfig = {
    v2c?: Pipe[];
    c2v?: Pipe[];
    order?: TPipeOrder;
  };

  export type FormConfig = {
    trigger?: 'onBlur' | 'onChange';
    disabled?: boolean;
  };

  export type DeepReadonly<T> = {
    [P in keyof T]: DeepReadonly<T[P]>;
  };

  export type ValidMap = {
    [vid: string]: ValidateStatus;
  };

  export type Path = string | number;

  export type PathMap = {
    [vid: string]: string;
  };

  export type Effects = void | 'change' | 'reset';
}
