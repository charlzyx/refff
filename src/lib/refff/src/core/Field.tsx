/* eslint-disable no-console */
import {
  Event,
  FieldMapping,
  FieldProps,
  PipeConfig,
  Rule,
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

type Base = {
  trigger?: 'onBlur' | 'onChange';
  children: ReactElement | ((props: object) => ReactElement);
  editable?: boolean;
  rules?: Rule | Rule[];
  pipe?: PipeConfig;
  map?: FieldMapping;
  label?: string;
} & Omit<FieldProps, 'children'>;

type WithPath = {
  path: any;
};

type WithUnderPath = {
  __path: string;
};

type WithoutPath = {};

type Props = OneOf<WithPath, OneOf<WithUnderPath, WithoutPath>> & Base;

export const Field: FC<Props> = ({
  children,
  __path = '',
  trigger,
  rules,
  editable,
  pipe,
  map,
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
      emit.change({ value: next, path: __path, source: uid.current });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [__path]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others.label, rules]);

  // 监听者们
  const onChange = useCallback<Event.change>(
    ({ value, path, source }) => {
      if (source === uid.current) return;
      const next = _.get(data.current, __path);
      if (isPathContain(__path, path) && next !== value) {
        setValue(next);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [__path]
  );
  const onReset = useCallback<Event.reset>(
    ({ path }) => {
      const should = !path || path === __path;
      if (should) {
        setValue(_.get(data.current, __path));
        setValidStatus('init');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [__path]
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
    return () => {
      godie();
      emit.unmounted({ vid: uid.current });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
  const mapping = merge.mapping(settings.get().map, statics.map, map);
  const pipes = merge.pipe(settings.get().pipe, statics.pipe, pipe);
  const byPipes = pipes.by.concat(emitChange);
  const waitOverrides = {
    value: flush(pipes.to, value),
    onChange: (x: any) => {
      console.log('xxx', x, byPipes);
      return flush(byPipes, x);
    },
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
