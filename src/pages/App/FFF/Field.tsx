import { Ctx, Event, ValidateResult } from './ctx';
import { FiledProps, Rule } from '@refff/core';
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
import { flush, isPathContain } from './utils';

import _ from 'lodash';
import { settings } from './settings';

const notReady = () => Promise.resolve('init');

type OneOf<T, U> =
  | ({ [P in keyof T]?: never } & U)
  | ({ [P in keyof U]?: never } & T);

type Base = {
  trigger?: 'onBlur' | 'onChange';
  children: ReactElement;
  editable?: boolean;
  rules?: Rule | Rule[];
} & FiledProps;

type WithPath = {
  path: string;
};

type WithUnderPath = {
  __path: string;
};

type WithoutPath = {};

type Props = OneOf<WithPath, OneOf<WithUnderPath, WithoutPath>> & Base;

const { UI, validator } = settings;

export const Field: FC<Props> = ({
  children,
  path = '',
  __path = '',
  trigger,
  rules,
  ...others
}) => {
  const finalPath = __path || path;
  const uid = useRef(_.uniqueId('fff_filed'));
  const {
    actions: { on, emit },
    data,
    config
  } = useContext(Ctx);
  const [value, setValue] = useState(_.get(data, finalPath));
  const [validStatus, setValidStatus] = useState<ValidateResult>('init');
  const finalTrigger = trigger || config.trigger;

  const checkerRef = useRef(notReady);

  // 触发方法们
  const doChange = useCallback((next: typeof value) => {
    setValue(next);
    emit.change({ value: next, path: finalPath, source: uid.current });
  }, []);
  // 如何保证 check 的时候值是最新的, 而不是闭包里的
  const doValidate = useCallback<Event.validtor>(() => {
    setValidStatus('validating');
  }, [rules, value]);

  // 监听者们
  const onChange = useCallback<Event.change>(({ value, path, source }) => {
    if (source === uid.current) return;
    const next = _.get(data, finalPath);
    if (isPathContain(finalPath, path) && next !== value) {
      setValue(next);
    }
  }, []);
  const onReset = useCallback<Event.reset>(({ path }) => {
    const should = !path || path === finalPath;
    if (should) {
      setValue(_.get(data, finalPath));
      setValidStatus('init');
    }
  }, []);
  const onClean = useCallback<Event.clean>(({ path }) => {
    const should = !path || path === finalPath;
    if (should) {
      setValidStatus('init');
    }
  }, []);

  // 事件的注册与销毁
  useEffect(() => {
    const unlistens: Function[] = [];
    emit.mounted({
      vid: uid.current,
      path: finalPath,
      checker: () => {
        return checkerRef.current();
      }
    });
    unlistens.push(on.change(onChange));
    unlistens.push(on.reset(onReset));
    unlistens.push(on.clean(onClean));
    return () => {
      // cleaner
      flush(unlistens);
      emit.unmounted({ vid: uid.current });
    };
  }, []);

  useEffect(() => {
    if (finalTrigger === 'onChange') {
      // do validate
    }
  }, [value]);
  useEffect(() => {
    checkerRef.current = doValidate;
  }, [doValidate]);
  const overrides = {
    validStatus,
    value,
    onChange
  };
  if (typeof children === 'function') {
    return <UI.Field {...others}>{children(overrides)}</UI.Field>;
  }
  const childProps = children.props;
  const clone = cloneElement(children, {
    ...childProps,
    ...overrides
  });
  return <UI.Field {...others}>{clone}</UI.Field>;
};
