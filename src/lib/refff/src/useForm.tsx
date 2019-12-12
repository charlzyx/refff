/* eslint-disable no-console */
import { Event, ValidateStatus } from '@refff/core';
import { Patch, applyPatches, produce } from 'immer';
import pool, { dying } from './pool';
import { useCallback, useEffect, useRef } from 'react';

import { Ctx } from './ctx';
import _ from 'lodash';

type DeepReadonly<T> = {
  [P in keyof T]: DeepReadonly<T[P]>;
};

type THistory = {
  redos: Patch[];
  undos: Patch[];
};

type ValidMap = {
  [vid: string]: ValidateStatus;
};

type PathMap = {
  [vid: string]: string;
};

export const useForm = <T extends object>(init: T) => {
  const uid = useRef(_.uniqueId('fff_form'));
  const data = useRef(init);
  const validMap = useRef<ValidMap>({});
  const pathMap = useRef<PathMap>({});
  const checkerQueue = useRef<{ vid: string; runner: Event.validator }[]>([]);

  const ctx = useRef<Ctx>({
    config: {},
    data: data.current,
    fid: uid.current
  });

  const history = useRef<THistory>({
    redos: [],
    undos: []
  });

  const { emit, on } = pool.get(uid.current);

  // 外部触发的方法们
  const doPut = useCallback((recipe: (copy: T) => void | T) => {
    const next = produce(data.current, recipe, (patches, inversPatches) => {
      history.current.redos.push(...patches);
      history.current.undos.push(...inversPatches.reverse());
      patches.forEach(patch => {
        emit.change({
          value: patch.value,
          path: patch.path,
          source: uid.current
        });
      });
    });
    data.current = next as T;
    return next;
  }, []);

  const doReset = useCallback((path?: string) => {
    const next = applyPatches(data.current, history.current.undos);
    data.current = next;
    emit.reset({ path });
  }, []);

  const doClean = useCallback((path?: string) => {
    emit.clean({ path });
  }, []);

  const doChecking = useCallback((path?: string) => {
    if (path) {
      const checker = checkerQueue.current.find(
        c => pathMap.current[c.vid] === path
      );
      if (checker && typeof checker.runner === 'function') {
        return checker.runner().then(() => _.get(data.current, path));
      } else {
        return Promise.resolve(_.get(data.current, path));
      }
    } else {
      return Promise.all(checkerQueue.current.map(c => c.runner())).then<T>(
        () => data.current
      );
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
        checkerQueue.current.splice(index, 1);
      }
    });
  }, []);
  const onChange = useCallback<Event.change>(({ value, path, source }) => {
    if (source === uid.current) return;
    _.set(data.current, path, value);
  }, []);
  const onValidate = useCallback<Event.validate>(({ vid, status }) => {
    validMap.current[vid] = status;
  }, []);

  // 事件的注册与销毁
  useEffect(() => {
    // on.debug((...args) => {
    //   console.log(data);
    //   console.log(args);
    // });
    const godie = dying(
      uid.current,
      on.change(onChange),
      on.validate(onValidate),
      on.mounted(onMounted),
      on.unmounted(onUnMounted)
    );

    return () => {
      godie();
    };
  }, []);

  const proxy = new Proxy(data, {
    get(target, key) {
      if (key === 'current') {
        return Reflect.get(target, key);
      }
      if (key === '__ctx') {
        return ctx.current;
      }
      return Reflect.get(target.current, key);
    }
  }) as DeepReadonly<T & { __ctx: typeof ctx }>;

  type OverChecking = {
    (path: string): Promise<Partial<T>>;
    (): Promise<T>;
  };
  const ans: {
    data: typeof proxy;
    reset: typeof doReset;
    put: typeof doPut;
    clean: typeof doClean;
    checking: OverChecking;
  } = {
    data: proxy,
    reset: doReset,
    put: doPut,
    clean: doClean,
    checking: doChecking
  };
  return ans;
};
