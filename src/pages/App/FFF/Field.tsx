import { Ctx, Event, ValidateStatus } from './ctx';
import { FiledProps, Rule } from '@refff/core';
import { Link, settings } from './settings';
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
import { flush, isPathContain, promisify, useRefState } from './utils';

import _ from 'lodash';

const { UI, validator, link: defaultLink } = settings;

const notReady = () => Promise.resolve();

type OneOf<T, U> =
  | ({ [P in keyof T]?: never } & U)
  | ({ [P in keyof U]?: never } & T);

type Base = {
  trigger?: 'onBlur' | 'onChange';
  children: ReactElement | ((props: object) => ReactElement);
  editable?: boolean;
  rules?: Rule | Rule[];
  link?: Link;
  label?: string;
} & Omit<FiledProps, 'children'>;

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
  link,
  ...others
}) => {
  const uid = useRef(_.uniqueId('fff_filed'));
  const {
    actions: { on, emit },
    data,
    config
  } = useContext(Ctx);
  const [value, setValue, valueRef] = useRefState(_.get(data, __path));
  const [help, setHelp] = useState('');
  const [valid, setValidStatus] = useState<ValidateStatus>('init');
  const race = useRef(0);
  const finalTrigger = trigger || config.trigger;
  const finalEditable = editable || config.editable;

  const checkerRef = useRef<Event.validator>(notReady);

  // 触发方法们
  const doChange = useCallback((next: typeof value) => {
    setValue(next);
    emit.change({ value: next, path: __path, source: uid.current });
  }, []);
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
  }, [rules]);

  // 监听者们
  const onChange = useCallback<Event.change>(({ value, path, source }) => {
    if (source === uid.current) return;
    const next = _.get(data, __path);
    if (isPathContain(__path, path) && next !== value) {
      setValue(next);
    }
  }, []);
  const onReset = useCallback<Event.reset>(({ path }) => {
    const should = !path || path === __path;
    if (should) {
      setValue(_.get(data, __path));
      setValidStatus('init');
    }
  }, []);
  const onClean = useCallback<Event.clean>(({ path }) => {
    const should = !path || path === __path;
    if (should) {
      setValidStatus('init');
    }
  }, []);

  // 事件的注册与销毁
  useEffect(() => {
    const unlistens: Function[] = [];
    emit.mounted({
      vid: uid.current,
      path: __path,
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
      doValidate();
    }
  }, [value]);

  useEffect(() => {
    checkerRef.current = doValidate;
  }, [doValidate]);

  useEffect(() => {
    if (valid !== 'timeout') {
      emit.validate({ vid: uid.current, status: valid });
    }
  }, [valid]);

  const overChange = useCallback((next: typeof value) => {
    doChange(next);
    return next;
  }, []);

  const overBlur = useCallback(e => {
    if (finalTrigger === 'onBlur') {
      doValidate();
    }
    return e;
  }, []);

  const childProps = (children as ReactElement).props || {};
  const rides = {
    value,
    onChange: overChange,
    onBlur: overBlur,
    editable: finalEditable,
    valid,
    help
  };
  const childrenStaticLink =
    children && (children as any).type && (children as any).type.link;

  const defaultOver = defaultLink(childProps, rides);
  const staticOver = childrenStaticLink
    ? childrenStaticLink(childProps, defaultOver)
    : defaultOver;
  const propsOver = link ? link(childProps, staticOver) : staticOver;

  const overrides = {
    ...defaultOver,
    ...staticOver,
    ...propsOver
  };

  if (typeof children === 'function') {
    return <UI.Field {...others}>{children(overrides)}</UI.Field>;
  } else {
    const clone = cloneElement(children as ReactElement, overrides);
    return <UI.Field {...others}>{clone}</UI.Field>;
  }
};
