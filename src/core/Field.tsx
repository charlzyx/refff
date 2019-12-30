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
  useDebounce,
} from '../utils';

import { Ctx } from './ctx';
import _ from 'lodash';
import { settings } from '../settings';
import { useRefState } from '../utils/useRefState';

const { UI } = settings.get();

const notReady = () => Promise.resolve();
const noop = (...args: any): any => {};

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
    path: __path,
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
  // Form context
  const { fid, data, config } = useContext(Ctx);
  // events
  const { emit, on } = pool.get(fid);
  const prePath = useRef('');
  const [initialized, setInitialized] = useState(false);
  // 方法的引用们
  const onRefs = useRef({
    change: noop,
    reset: noop,
    clean: noop,
    init: noop,
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
        .replace(/%label/g, others.label || '')
        .replace(/%path/g, __path.toString() || '')
        .replace(/%value/, valueRef.current);
    },
    [__path, others.label, valueRef],
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
  const checkerRef = useRef<Event.validator>(notReady);

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
  // 监听外部变更
  const onChange = useCallback<Event.change>(
    ({ next, path, source }) => {
      if (source === uid.current) {
        touched.current = true;
        return;
      }
      const deps = getDepsByPath(__path);

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
      if (__path === undefined) return;
      const deps = getDepsByPath(__path);
      const should = !path || isDepsMatched(path, deps);
      if (should) {
        // 更新最新值
        setValue(getValueByPath(data.current, __path));
        // 触发挂载事件
        const validStatus = rules ? (withValid ? 'init' : valid) : 'success';

        emit.mounted({
          vid: uid.current,
          path: __path,
          checker: () => {
            return checkerRef.current();
          },
          validStatus,
        });
        setValidStatus(validStatus);
        if (withValid) {
          doValidate();
          // checkerRef.current();
        }
      }
    },
    [__path, data, doValidate, emit, rules, setValue, valid],
  );

  // init 之后再触发各种事情(valid, mounted.....)
  const onInit = useCallback<Event.init & { withValid?: boolean }>(
    ({ next }) => {
      if (__path === undefined) return;
      // 更新最新值
      setValue(getValueByPath(next, __path));
      // 触发挂载事件
      const validStatus = rules ? 'init' : 'success';
      setValidStatus(validStatus);
      setInitialized(true);
      emit.mounted({
        vid: uid.current,
        path: __path,
        checker: () => {
          return checkerRef.current();
        },
        validStatus,
      });
    },
    [__path, emit, rules, setValue],
  );

  useEffect(() => {
    onRefs.current.change = onChange;
    onRefs.current.reset = onReset;
    onRefs.current.clean = onClean;
    onRefs.current.init = onInit;
  }, [onChange, onClean, onInit, onReset]);

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
      doValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceValue, finalTrigger]);

  // 更新 useForm 中使用的 run check
  useEffect(() => {
    checkerRef.current = doValidate;
  }, [doValidate]);

  useEffect(() => {
    if (finaldisabled) {
      emit.unmounted({ vid: uid.current });
    } else {
      // 模拟一次 init
      emit.init({ next: data.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finaldisabled]);

  useEffect(() => {
    if (!_.isEqual(prePath.current, __path) && initialized) {
      prePath.current = __path;
      // emit.unmounted({ vid: uid.current });
      emit.init({ next: data.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [__path, initialized]);

  // 校验状态变更, 通知 useForm
  useEffect(() => {
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
      on.init((...args) => onRefs.current.init(...args)),
      on.change((...args) => onRefs.current.change(...args)),
      on.reset((...args) => onRefs.current.reset(...args)),
      on.clean((...args) => onRefs.current.clean(...args)),
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
      <UI.Field {...filedProps}>{children(overrides)}</UI.Field>
    ) : (
      children(overrides)
    );
  }
  const clone = cloneElement(children as ReactElement, overrides);
  return <UI.Field {...filedProps}>{clone}</UI.Field>;
};
