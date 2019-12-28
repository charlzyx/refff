/* eslint-disable max-lines */
import {
  Event,
  FieldProps,
  Rule,
  TFieldMeta,
  TPipeConfig,
  ValidateStatus,
} from '@refff/core';
import React, {
  FC,
  ReactElement,
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  dying,
  flush,
  getDepsByPath,
  getValueByPath,
  isDepsMatched,
  isMatch,
  merge,
  pool,
  promisify,
  remapping,
} from '../utils';

import { Ctx } from './ctx';
import _ from 'lodash';
import { settings } from '../settings';
import { useRefState } from '../utils/useRefState';

const { UI } = settings.get();

const notReady = () => Promise.resolve();

// type OneOf<T, U> =
//   | ({ [P in keyof T]?: never } & U)
//   | ({ [P in keyof U]?: never } & T);

type TProps = {
  trigger?: 'onBlur' | 'onChange';
  children:
    | ReactElement
    | null
    | ((props: {
        value: any;
        onChange: (x: any) => any;
        onBlur: () => void;
        disabled: boolean;
        valid: ValidateStatus;
        help: string;
      }) => ReactElement | null);
  disabled?: boolean;
  rules?: Rule | Rule[];
  pipe?: TPipeConfig;
  meta?: TFieldMeta;
  label?: string;
  path: any;
  value?: never;
  box?: boolean;
  effect?: (value: any) => void;
  // list?: boolean;
} & Omit<FieldProps, 'children'>;

export const Field: FC<TProps> = (props) => {
  const {
    children,
    path: __path = '',
    trigger,
    rules,
    disabled,
    pipe,
    meta,
    box,
    effect,
    // list,
    ...others
  } = props;
  const uid = useRef(_.uniqueId('fff_filed'));
  const { fid, data, config } = useContext(Ctx);
  const { emit, on } = pool.get(fid);
  const touched = useRef(false);
  const [value, setValue, valueRef] = useRefState(
    getValueByPath(data.current, __path),
  );
  const [help, setHelp] = useState('');
  const [valid, setValidStatus] = useState<ValidateStatus>('init');
  const race = useRef(0);
  const finalTrigger = trigger || config.trigger;
  const finaldisabled = disabled === undefined ? config.disabled : disabled;

  const checkerRef = useRef<Event.validator>(notReady);
  const helphelp = useCallback(
    (msg: string | undefined | void | null) => {
      if (!msg) return '';
      return msg
        .replace(/%label/g, others.label || '')
        .replace(/%path/g, __path.toString() || '')
        .replace(/%value/, valueRef.current);
    },
    [__path, others.label, valueRef],
  );

  // 触发方法们
  const doChange = useCallback(
    (next: typeof value) => {
      setValue(next);
      // const deps = getDepsByPath(__path);
      if (Array.isArray(__path)) {
        __path.forEach((pair) => {
          emit.change({
            next: _.get(next, pair[0]),
            path: pair[1],
            source: uid.current,
          });
        });
      } else {
        emit.change({
          next,
          path: __path,
          source: uid.current,
        });
      }
    },
    [__path, emit, setValue, value],
  );

  const doValidate = useCallback<Event.validator>(() => {
    setValidStatus('validating');
    const count = ++race.current;
    if (!rules) {
      setValidStatus('success');
      return Promise.resolve();
    }
    if (Array.isArray(rules)) {
      return Promise.all(
        rules.map((rule) =>
          promisify(() =>
            settings.get().validator(valueRef, rule, others.label),
          ),
        ),
      )
        .then((results) => {
          if (count < race.current) {
            return 'timeout';
          }
          const msg = results.find((x) => x);
          setValidStatus('success');
          setHelp(helphelp(msg));
        })
        .catch((error) => {
          if (count < race.current) {
            return 'timeout';
          }
          setValidStatus('error');
          setHelp(helphelp(error?.message));
          throw error;
        });
    }
    return promisify(() =>
      settings.get().validator(valueRef, rules, others.label),
    )
      .then((msg) => {
        if (count < race.current) {
          return 'timeout';
        }
        setValidStatus('success');
        setHelp(helphelp(msg));
      })
      .catch((error) => {
        if (count < race.current) {
          return 'timeout';
        }
        setValidStatus('error');
        setHelp(helphelp(error?.message));
        throw error;
      });
  }, [helphelp, others.label, rules, valueRef]);

  // 监听者们
  const onChange = useCallback<Event.change>(
    ({ next, path, source }) => {
      if (source === uid.current) {
        touched.current = true;
        return;
      }
      const deps = getDepsByPath(__path);
      if (Array.isArray(deps)) {
        const matched = isDepsMatched(path, deps);
        if (matched) {
          touched.current = true;
          setValue(getValueByPath(data.current, __path));
        }
      } else if (isMatch(__path, path) && next !== valueRef.current) {
        touched.current = true;
        setValue(next);
      }
    },
    [__path, data, setValue, valueRef],
  );
  const onReset = useCallback<Event.reset>(
    ({ path, replaced }) => {
      const deps = getDepsByPath(__path);
      const should = !path || isDepsMatched(path, deps);
      if (should) {
        if (replaced) {
          touched.current = false;
        }
        setValue(getValueByPath(data.current, __path));
        setValidStatus('init');
      }
    },
    [__path, data, setValue],
  );
  const onClean = useCallback<Event.clean>(
    ({ path }) => {
      const deps = getDepsByPath(__path);
      const should = !path || isDepsMatched(path, deps);
      if (should) {
        setValidStatus('init');
      }
    },
    [__path],
  );

  // 事件的注册与销毁
  useEffect(() => {
    const deps = getDepsByPath(__path);
    // 等待 useForm 挂载完监听 onValid时间
    setTimeout(() => {
      if (finaldisabled) {
        return;
      }
      emit.validate({ vid: uid.current, status: valid });
      emit.mounted({
        vid: uid.current,
        // 注意!! 这里会影响 dochecking, 比如要校验时间段, 就只能用
        // checking('start') 来校验这个动态字段
        path: Array.isArray(deps) ? deps[0] : (deps as string),
        checker: () => {
          return checkerRef.current();
        },
      });
    });

    const godie = dying(
      uid.current,
      on.change(onChange),
      on.reset(onReset),
      on.clean(onClean),
    );
    const vid = uid.current;
    return () => {
      godie();
      emit.unmounted({ vid });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof effect === 'function') {
      effect(valueRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, value]);

  useEffect(() => {
    if (!touched.current) {
      return;
    }
    if (finalTrigger === 'onChange') {
      doValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, finalTrigger]);

  useEffect(() => {
    checkerRef.current = doValidate;
  }, [doValidate]);

  useEffect(() => {
    const deps = getDepsByPath(__path);
    if (finaldisabled) {
      emit.unmounted({ vid: uid.current });
    } else {
      emit.mounted({
        vid: uid.current,
        // 注意!! 这里会影响 dochecking, 比如要校验时间段, 就只能用
        // checking('start') 来校验这个动态字段
        path: Array.isArray(deps) ? deps[0] : (deps as string),
        checker: () => {
          return checkerRef.current();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emit, finaldisabled]);

  useEffect(() => {
    if (valid !== 'timeout') {
      emit.validate({ vid: uid.current, status: valid });
    }
  }, [emit, valid]);

  const emitChange = useCallback(
    (next) => {
      console.log('ooooioemitChange', next);
      doChange(next);
      return next;
    },
    [doChange],
  );

  const childProps = (children as ReactElement).props || {};

  const emitBlur = useCallback(
    (e) => {
      const childOnBlur = childProps.onBlur;
      if (typeof childOnBlur === 'function') {
        childOnBlur(e);
      }
      if (finalTrigger === 'onBlur') {
        doValidate();
      }
      return e;
    },
    [childProps.onBlur, doValidate, finalTrigger],
  );

  const statics = ((children && (children as ReactElement).type) ||
    {}) as ReturnType<typeof settings.get>;
  const childMapping = merge.mapping.child(
    settings.get().meta.child,
    statics.meta?.child,
    meta?.child,
  );
  const filedMapping = merge.mapping.field(
    settings.get().meta.field,
    statics.meta?.field,
    meta?.field,
  );
  const pipes = merge.pipe(settings.get().pipe, statics.pipe, pipe);
  const byPipes = pipes.c2v.concat(emitChange);
  // 这个坑有点大, 后面填
  // if (list) {
  //   const slotdata = (children as ReactElement).props.data;
  //   const actions = {
  //     append() {
  //       setValue((v: any) => {
  //         return [...v, { ...slotdata }];
  //       });
  //     },
  //     remove(index: number) {
  //       setValue((v: any) => {
  //         return v.filter((x: any, idx: number) => idx !== index);
  //       });
  //     },
  //     insert(form: number, to: number) {
  //       const val = [...valueRef.current];
  //       const start = Math.min(form, to);
  //       let end = Math.max(form, to);
  //       const moved = val[end];
  //       while (end >= start) {
  //         if (end === start) {
  //           val[start] = moved;
  //         } else {
  //           val[end] = val[end - 1];
  //         }
  //         end--;
  //       }
  //       setValue(val);
  //     },
  //   };
  // }
  const waitOverrides = {
    value: flush(value, childProps, pipes.v2c),
    onChange: (x: any) => flush(x, childProps, byPipes),
    onBlur: emitBlur,
    disabled: finaldisabled,
    valid,
    help,
  };

  const overrides = {
    ...childProps,
    ...remapping(waitOverrides, childMapping),
    __path,
  };

  const filedProps = {
    ...others,
    ...remapping(waitOverrides, filedMapping),
  };

  if (typeof children === 'function') {
    return box === true ? (
      <UI.Field {...filedProps}>{children(overrides)}</UI.Field>
    ) : (
      children(overrides)
    );
  }
  const clone = cloneElement(children as ReactElement, overrides);
  return <UI.Field {...filedProps}>{clone}</UI.Field>;
};
