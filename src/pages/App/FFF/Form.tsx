/* eslint-disable prettier/prettier */
import { Consumer, Ctx, Event, Events, Provider, ValidateResult } from './ctx';
import { Immutable, Patch, Produced, applyPatches, produce } from 'immer';
import React, {
  FC,
  FunctionComponent,
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  WeakValidationMap,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import mitt, { Emitter } from 'mitt';

import _ from 'lodash';
import { flush } from './utils';

/* eslint-disable no-console */

type THistory = {
  redos: Patch[];
  undos: Patch[];
};

type ValidMap = {
  [vid: string]: ValidateResult;
};

type PathMap = {
  [vid: string]: string;
};

const event: mitt.Emitter = mitt();
export type FormConfig = {
  trigger?: 'onBlur' | 'onChange';
  editable?: boolean;
};
export type TForm<T> = {
  init: T;
  config?: FormConfig;
};


export type Props<T> = {
  init: T;
  config?: FormConfig;
  actions: MutableRefObject<{
    put: (recipe: (copy: T) => void | T) => T | Produced<T, T>
    reset: (path?: string) => void
    clean: (path?: string) => void
    checking: (path?: string) => Promise<ValidateResult | ValidateResult[]>
  }>
};

interface IForm {
  <T extends object>(
    props: Parameters<FunctionComponent<Props<T>>>[0],
    context?: Parameters<FunctionComponent<Props<T>>>[1]
  ): ReturnType<FunctionComponent<Props<T>>>;
  // 这里就没有办法用到 T 了, 所以不精确, 虽然实际上也用不着哈哈哈
  propTypes?: FunctionComponent<Props<object>>['propTypes'];
  contextTypes?: FunctionComponent<Props<any>>['contextTypes'];
  defaultProps?: FunctionComponent<Props<object>>['defaultProps'];
  displayName?: FunctionComponent<Props<any>>['displayName'];
}

export const Form: IForm = ({ init, children, config = {}, actions }) => {
  const uid = useRef(_.uniqueId('fff_form'));
  const data = useRef(init);
  const validMap = useRef<ValidMap>({});
  const pathMap = useRef<PathMap>({});
  const checkerQueue = useRef<{vid: string, runner: Event.validtor}[]>([]);

  const ctx = useRef<Ctx<typeof init>>({
    config,
    data: data.current,
    fid: uid.current,
    actions: {
      on: {
        change(fn) {
          event.on(Events(uid.current).change, fn);
          return () => {
            event.off(Events(uid.current).change, fn);
          };
        },
        reset(fn) {
          event.on(Events(uid.current).reset, fn);
          return () => {
            event.off(Events(uid.current).reset, fn);
          };
        },
        clean(fn) {
          event.on(Events(uid.current).clean, fn);
          return () => {
            event.off(Events(uid.current).clean, fn);
          };
        },
        mounted(fn) {
          event.on(Events(uid.current).mounted, fn);
          return () => {
            event.off(Events(uid.current).mounted, fn);
          };
        },
        unmounted(fn) {
          event.on(Events(uid.current).unmounted, fn);
          return () => {
            event.off(Events(uid.current).unmounted, fn);
          };
        },
        validate(fn) {
          event.on(Events(uid.current).validate, fn);
          return () => {
            event.off(Events(uid.current).validate, fn);
          };
        }
      },
      emit: {
        change(e) {
          event.emit(Events(uid.current).change, e);
        },
        reset(e) {
          event.emit(Events(uid.current).reset, e);
        },
        clean(e) {
          event.emit(Events(uid.current).clean, e);
        },
        mounted(e) {
          event.emit(Events(uid.current).mounted, e);
        },
        unmounted(e) {
          event.emit(Events(uid.current).unmounted, e);
        },
        validate(e) {
          event.emit(Events(uid.current).validate, e);
        }
      }
    }
  });

  const history = useRef<THistory>({
    redos: [],
    undos: []
  });

  // 触发器们
  const emits = ctx.current.actions.emit;

  // 外部触发的方法们
  const doPut = useCallback<typeof actions.current.put>(
    (recipe: (copy: typeof init) => void | typeof init) => {
      const next = produce(data.current, recipe, (patches, inversPatches) => {
        history.current.redos.push(...patches);
        history.current.undos.push(...inversPatches.reverse());
        patches.forEach(patch => {
          emits.change({ value: patch.value, path: patch.path, source: uid.current })
        })
      });
      data.current = next as typeof init;
      return next;
    }, []);

  const doReset = useCallback<typeof actions.current.reset>((path) => {
    const next = applyPatches(data.current, history.current.undos);
    data.current = next;
    emits.reset({ path });
  }, []);
  const doClean = useCallback<typeof actions.current.clean>((path) => {
    emits.clean({ path });
  }, []);
  const doChecking = useCallback<typeof actions.current.checking>((path) => {
    // return Promise.resolve('init');
    if (path) {
      const checker = checkerQueue.current.find(c => pathMap.current[c.vid] === path);
      if (checker && typeof checker.runner === 'function') {
        return checker.runner();
      } else {
        return Promise.resolve('success');
      }
    } else {
      return Promise.all(checkerQueue.current.map(c => c.runner()));
    }
  }, []);

  // 监听者们
  const onMounted = useCallback<Event.mounted>(({ vid, path, checker }) => {
    pathMap.current[vid] = path;
    validMap.current[vid] = 'init';
    checkerQueue.current.push({ vid, runner: checker });
  }, []);
  const onUnMounted = useCallback<Event.unmounted>(({ vid }) => {
    delete pathMap.current[vid];
    delete validMap.current[vid];
    checkerQueue.current.forEach((c, index) => {
      if (c.vid === vid) {
        checkerQueue.current.splice(index, 1)
      }
    });
  }, []);
  const onChange = useCallback<Event.change>(({ value, path, source }) => {
    if (source === uid.current) return;
    _.set(data.current, path, value);
  }, []);
  const onValidate = useCallback<Event.validate>(({vid, result}) => {
    validMap.current[vid] = result;
  }, []);

  // 事件的注册与销毁
  useEffect(() => {
    const unlistens: Function[] = [];
    unlistens.push(ctx.current.actions.on.change(onChange));
    unlistens.push(ctx.current.actions.on.validate(onValidate));
    unlistens.push(ctx.current.actions.on.mounted(onMounted));
    unlistens.push(ctx.current.actions.on.unmounted(onUnMounted));
    return () => {
      // cleaner
      flush(unlistens);
    };
  }, []);

  useEffect(() => {
    if (config) {
      ctx.current.config = config;
    }
  }, [config]);
  useEffect(() => {
    if (actions) {
      actions.current.put = doPut;
      actions.current.reset = doReset;
      actions.current.clean = doClean;
      actions.current.checking = doChecking;
    }
  }, [actions])

  return <Provider value={ctx.current}>{children}</Provider>;
};
