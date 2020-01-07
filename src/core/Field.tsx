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
  ReactNode,
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
  useDebounce,
} from '../utils';

import { Ctx } from './ctx';
import _ from 'lodash';
import { settings } from '../settings';
import { useRefState } from '../utils/useRefState';

const { UI } = settings.get();

const notReady = (): Promise<any> => Promise.resolve();
const noop = (...args: any): any => {};

const stringifyLabel = (
  label?: ReactNode | string,
  helpLabel?: string,
): string => {
  if (typeof label === 'string') return label;
  if (helpLabel) return helpLabel;
  return '';
};

type TProps = {
  trigger?: 'onBlur' | 'onChange';
  children:
    | ReactNode
    | null
    | ((props: {
        value: any;
        onChange: (x: any) => any;
        onBlur: () => void;
        disabled: boolean;
        valid: ValidateStatus;
        help: string;
      }) => ReactNode | null);
  disabled?: boolean;
  rules?: Rule | Rule[];
  pipe?: TPipeConfig;
  meta?: TFieldMeta;
  label?: string | ReactNode;
  helpLabel?: string;
  path: any;
  value?: never;
  box?: boolean;
  setWith?: 'Object';
  effect?: (value: any) => void;
  // list?: boolean;
} & Omit<FieldProps, 'children'>;

export const Field: FC<TProps> = (props) => {
  const {
    children,
    path: __path,
    trigger,
    rules,
    disabled,
    pipe,
    meta,
    box,
    effect,
    helpLabel,
    setWith,
    // list,
    ...others
  } = props;
  const uid = useRef(_.uniqueId('fff_filed'));
  // Form context
  const { fid, data, config } = useContext(Ctx);
  // events
  const { emit, on } = pool.get(fid);
  const prePath = useRef(__path);
  const preRules = useRef(rules);
  const initialized = useRef(false);
  const ignored = useRef(false);
  // 方法的引用们
  const fnRefs = useRef({
    change: noop,
    reset: noop,
    clean: noop,
    init: noop,
    validate: notReady,
  });
  // touched flag
  const touched = useRef(false);
  // value
  const [value, setValue, valueRef] = useRefState(
    getValueByPath(data.current, __path),
  );
  const debounceValue = useDebounce(value);
  // 校验信息
  const [help, setHelp] = useState('');
  // 校验信息辅助函数
  const helphelp = useCallback(
    (msg: string | undefined | void | null) => {
      if (!msg) return '';
      return msg
        .replace(/%label/g, stringifyLabel(others.label, helpLabel) || '')
        .replace(/%path/g, __path.toString() || '')
        .replace(/%value/, valueRef.current);
    },
    [__path, helpLabel, others.label, valueRef],
  );

  // 校验状态
  const [valid, setValidStatus] = useState<ValidateStatus>('init');
  // 校验竞态标记
  const race = useRef(0);
  // 触发 校验设置
  const finalTrigger = trigger || config.trigger;
  // 是否 disabled
  const finaldisabled = disabled === undefined ? config.disabled : disabled;
  // 校验函数

  // 触发方法们
  const doChange = useCallback(
    (next: typeof value) => {
      setValue(next);
      // 结构形式会有多个 path
      if (Array.isArray(__path)) {
        __path.forEach((pair) => {
          emit.change({
            next: _.get(next, pair[0]),
            path: pair[1],
            source: uid.current,
            setWith,
          });
        });
      } else {
        emit.change({
          next,
          path: __path,
          source: uid.current,
          setWith,
        });
      }
    },
    [__path, emit, setValue, setWith, value],
  );

  // 校验方法
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
            settings
              .get()
              .validator(
                valueRef,
                rule,
                stringifyLabel(others.label, helpLabel),
              ),
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
      settings
        .get()
        .validator(valueRef, rules, stringifyLabel(others.label, helpLabel)),
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
  }, [helpLabel, helphelp, others.label, rules, valueRef]);

  // 监听者们
  // 监听外部变更
  const onChange = useCallback<Event.change>(
    ({ next, path, source }) => {
      if (source === uid.current) {
        touched.current = true;
        return;
      }
      setTimeout(() => {
        const deps = getDepsByPath(__path);

        // 就很蛋疼,  有两个同名path的时候 一个更新了,
        // 另一个在这里获取 neo 的时候, 外面还没更新
        // 所以外面套一个 setTimeout 等外面更新完
        const neo = getValueByPath(data.current, __path);
        if (Array.isArray(deps)) {
          const matched = isDepsMatched(path, deps);
          if (matched) {
            touched.current = true;
            setValue(neo);
          }
        } else if (isMatch(__path, path) && neo !== valueRef.current) {
          touched.current = true;
          setValue(neo);
        }
      });
    },
    [__path, data, setValue, valueRef],
  );

  // 清理校验
  const onClean = useCallback<Event.clean>(
    ({ path }) => {
      const deps = getDepsByPath(__path);
      const should = !path || isDepsMatched(path, deps);
      if (should && rules) {
        setValidStatus('init');
      }
    },
    [__path, rules],
  );

  // reset 方法
  const onReset = useCallback<Event.reset>(
    ({ path, replaced, withValid }) => {
      const deps = getDepsByPath(__path);
      const should = !path || isDepsMatched(path, deps);
      if (should) {
        // 更新最新值
        setValue(getValueByPath(data.current, __path));
        // 触发挂载事件
        const validStatus = rules && withValid ? 'init' : undefined;
        setValidStatus(validStatus || 'timeout');
        setHelp('');
        touched.current = false;

        emit.mounted({
          vid: uid.current,
          path: __path,
          checker: () => {
            return fnRefs.current.validate();
          },
          validStatus,
        });
        if (withValid) {
          setTimeout(() => {
            fnRefs.current.validate();
          });
        }
      }
    },
    [__path, data, emit, rules, setValue],
  );

  // init 之后再触发各种事情(valid, mounted.....)
  const onInit = useCallback<Event.init>(
    ({ next }) => {
      // 更新最新值
      setValue(getValueByPath(next, __path));
      // 触发挂载事件
      // 触发挂载事件
      const validStatus = rules ? 'init' : undefined;
      setValidStatus(validStatus || 'timeout');
      setHelp('');
      initialized.current = true;
      emit.mounted({
        vid: uid.current,
        path: __path,
        checker: () => {
          return fnRefs.current.validate();
        },
        validStatus,
      });
    },
    [__path, emit, rules, setValue],
  );

  useEffect(() => {
    fnRefs.current.change = onChange;
    fnRefs.current.reset = onReset;
    fnRefs.current.clean = onClean;
    fnRefs.current.init = onInit;
    fnRefs.current.validate = doValidate;
  }, [onChange, onClean, onInit, onReset, doValidate]);

  // 触发 Field effect
  useEffect(() => {
    if (typeof effect === 'function') {
      effect(valueRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, value]);

  // 触发 validate
  useEffect(() => {
    if (!touched.current) {
      return;
    }
    if (finalTrigger === 'onChange') {
      fnRefs.current.validate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceValue, finalTrigger]);

  // 会被 disabled 影响的挂载与卸载
  useEffect(() => {
    if (!!finaldisabled && ignored.current === false) {
      emit.unmounted({ vid: uid.current });
      ignored.current = true;
    }
    if (!finaldisabled && ignored.current === true) {
      // 模拟一次 init
      emit.init({ next: data.current });
      ignored.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finaldisabled]);

  useEffect(() => {
    if (!_.isEqual(prePath.current, __path)) {
      prePath.current = __path;
      emit.unmounted({ vid: uid.current });
      setTimeout(() => {
        emit.init({ next: data.current });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [__path]);

  useEffect(() => {
    if (!_.isEqual(preRules.current, rules)) {
      preRules.current = rules;
      emit.unmounted({ vid: uid.current });
      setTimeout(() => {
        emit.init({ next: data.current });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  // 校验状态变更, 通知 useForm
  useEffect(() => {
    if (!initialized.current) return;
    if (valid !== 'timeout') {
      emit.validate({ vid: uid.current, status: valid });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emit, valid]);

  useEffect(() => {
    // mounted
    const vid = uid.current;

    const godie = dying(
      uid.current,
      on.init((...args) => fnRefs.current.init(...args)),
      on.change((...args) => fnRefs.current.change(...args)),
      on.reset((...args) => fnRefs.current.reset(...args)),
      on.clean((...args) => fnRefs.current.clean(...args)),
    );
    // unmounted
    return () => {
      godie();
      emit.unmounted({ vid });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitChange = useCallback(
    (next) => {
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
        fnRefs.current.validate();
      }
      return e;
    },
    [childProps.onBlur, finalTrigger],
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

  const waitOverrides = {
    value: flush(valueRef.current, childProps, pipes.v2c),
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
      <UI.Field {...filedProps}>{(children as FC)(overrides)}</UI.Field>
    ) : (
      (children as FC)(overrides)
    );
  }
  const clone = cloneElement(children as ReactElement, overrides);
  return <UI.Field {...filedProps}>{clone}</UI.Field>;
};
