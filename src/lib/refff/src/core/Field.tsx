/* eslint-disable no-console */
import {
  Event,
  FieldProps,
  Rule,
  TFieldMeta,
  TPipeConfig,
  ValidateStatus
} from '@refff/core';
import React, {
  FC,
  ReactElement,
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  dying,
  flush,
  isPathContain,
  merge,
  pool,
  promisify,
  remapping
} from '../utils';

import { Ctx } from './ctx';
import _ from 'lodash';
import { settings } from '../settings';
import { useRefState } from '../utils/useRefState';

const { UI, validator } = settings.get();

const notReady = () => Promise.resolve();

type OneOf<T, U> =
  | ({ [P in keyof T]?: never } & U)
  | ({ [P in keyof U]?: never } & T);

type TBase = {
  trigger?: 'onBlur' | 'onChange';
  children: ReactElement | ((props: object) => ReactElement);
  editable?: boolean;
  rules?: Rule | Rule[];
  pipe?: TPipeConfig;
  meta?: TFieldMeta;
  label?: string;
} & Omit<FieldProps, 'children'>;

type TWithPath = {
  path: any;
};

type TWithUnderPath = {
  __path: string;
};

type TWithoutPath = {};

type TProps = OneOf<TWithPath, OneOf<TWithUnderPath, TWithoutPath>> & TBase;

export const Field: FC<TProps> = ({
  children,
  __path = '',
  trigger,
  rules,
  editable,
  pipe,
  meta,
  ...others
}) => {
  const uid = useRef(_.uniqueId('fff_filed'));
  const { fid, data, config } = useContext(Ctx);
  const { emit, on } = pool.get(fid);
  const [value, setValue, valueRef] = useRefState(_.get(data.current, __path));
  const [help, setHelp] = useState('');
  const [valid, setValidStatus] = useState<ValidateStatus>('init');
  const race = useRef(0);
  const finalTrigger = trigger || config.trigger;
  const finalEditable = editable || config.editable;

  const checkerRef = useRef<Event.validator>(notReady);

  // 触发方法们
  const doChange = useCallback(
    (next: typeof value) => {
      setValue(next);
      emit.change({ next, path: __path, source: uid.current });
    },
    [__path, emit, setValue, value]
  );
  const doValidate = useCallback<Event.validator>(() => {
    setValidStatus('validating');
    const count = race.current++;
    if (!rules) {
      setValidStatus('success');
      return Promise.resolve();
    }
    if (Array.isArray(rules)) {
      return Promise.all(
        rules.map(rule =>
          promisify(() => validator(valueRef, rule, others.label))
        )
      )
        .then(results => {
          if (count < race.current) {
            return 'timeout';
          }
          const msg = results.find(x => x);
          setValidStatus('success');
          setHelp(msg || '');
        })
        .catch(error => {
          if (count < race.current) {
            return 'timeout';
          }
          setValidStatus('error');
          setHelp(error?.message || '出错了');
          throw error;
        });
    } else {
      return promisify(() => validator(valueRef, rules, others.label))
        .then(msg => {
          if (count < race.current) {
            return 'timeout';
          }
          setValidStatus('success');
          setHelp(msg || '');
        })
        .catch(error => {
          if (count < race.current) {
            return 'timeout';
          }
          setValidStatus('error');
          setHelp(error?.message || '出错了');
          throw error;
        });
    }
  }, [others.label, rules, valueRef]);

  // 监听者们
  const onChange = useCallback<Event.change>(
    ({ next, path, source }) => {
      console.log('source', { value, path, source });
      if (source === uid.current) return;
      // const next = _.get(data.current, __path);
      if (isPathContain(__path, path) && next !== value) {
        setValue(next);
      }
    },
    [__path, setValue, value]
  );
  const onReset = useCallback<Event.reset>(
    ({ path }) => {
      const should = !path || path === __path;
      if (should) {
        setValue(_.get(data.current, __path));
        setValidStatus('init');
      }
    },
    [__path, data, setValue]
  );
  const onClean = useCallback<Event.clean>(
    ({ path }) => {
      const should = !path || path === __path;
      if (should) {
        setValidStatus('init');
      }
    },
    [__path]
  );

  // 事件的注册与销毁
  useEffect(() => {
    emit.mounted({
      vid: uid.current,
      path: __path,
      checker: () => {
        return checkerRef.current();
      }
    });
    const godie = dying(
      uid.current,
      on.change(onChange),
      on.reset(onReset),
      on.clean(onClean)
    );
    const vid = uid.current;
    return () => {
      godie();
      emit.unmounted({ vid });
    };
  }, [__path, emit, on, onChange, onClean, onReset]);

  useEffect(() => {
    if (finalTrigger === 'onChange') {
      doValidate();
    }
  }, [doValidate, finalTrigger, value]);

  useEffect(() => {
    checkerRef.current = doValidate;
  }, [doValidate]);

  useEffect(() => {
    if (valid !== 'timeout') {
      emit.validate({ vid: uid.current, status: valid });
    }
  }, [emit, valid]);

  const emitChange = useCallback(
    next => {
      doChange(next);
      return next;
    },
    [doChange]
  );

  const childProps = (children as ReactElement).props || {};

  const emitBlur = useCallback(
    e => {
      const ob = childProps.onBlur;
      if (typeof ob === 'function') {
        ob(e);
      }
      if (finalTrigger === 'onBlur') {
        doValidate();
      }
      return e;
    },
    [childProps.onBlur, doValidate, finalTrigger]
  );

  const statics = ((children && (children as ReactElement).type) ||
    {}) as ReturnType<typeof settings.get>;
  const mapping = merge.mapping(settings.get().meta, statics.meta, meta);
  const pipes = merge.pipe(settings.get().pipe, statics.pipe, pipe);
  const byPipes = pipes.c2v.concat(emitChange);
  const waitOverrides = {
    value: flush(value, pipes.v2c),
    onChange: (x: any) => flush(x, byPipes),
    onBlur: emitBlur,
    editable: finalEditable,
    valid,
    help
  };

  const overrides = {
    ...childProps,
    ...remapping(waitOverrides, mapping)
  };

  if (typeof children === 'function') {
    return <UI.Field {...others}>{children(overrides)}</UI.Field>;
  } else {
    const clone = cloneElement(children as ReactElement, overrides);
    return <UI.Field {...others}>{clone}</UI.Field>;
  }
};
