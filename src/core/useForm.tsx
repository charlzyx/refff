import { DeepReadonly, Effects, Event, PathMap, ValidMap } from '@refff/core';
import { Patch, applyPatches, produce } from 'immer';
import { dying, isMatch, isValid, pool } from '../utils';
import { useCallback, useEffect, useRef } from 'react';

import { TCtx } from './ctx';
import _ from 'lodash';
import { useRefState } from '../utils/useRefState';

export const useForm = <T extends object>(
  init: T,
  effect?: (data: T, type: Effects, e?: any) => void,
) => {
  const uid = useRef(_.uniqueId('fff_form'));
  const data = useRef<T>(init);
  const [valid, setValid, validRef] = useRefState(false);
  const validMap = useRef<ValidMap>({});
  const pathMap = useRef<PathMap>({});
  const checkerQueue = useRef<{ vid: string; runner: Event.validator }[]>([]);

  const ctx = useRef<TCtx>({
    config: {},
    data,
    fid: uid.current,
  });

  const history = useRef<Patch[]>([]);
  const redos = useRef<Patch[]>([]);

  const { emit, on } = pool.get(uid.current);

  /**
   * WIP: 时光旅行
   */
  const undo = useCallback(() => {
    const patch = history.current.pop();
    if (patch) {
      redos.current.push(patch);
      const next = applyPatches(data.current, [patch]);
      data.current = next;
      emit.change({
        next: patch.value,
        path: patch.path,
        source: uid.current,
      });
    }
  }, [emit]);

  const redo = useCallback(() => {
    const patch = redos.current.pop();
    redos.current.pop();
    if (patch) {
      history.current.push(patch);
      const next = applyPatches(data.current, [patch]);
      data.current = next;
      emit.change({
        next: patch.value,
        path: patch.path,
        source: uid.current,
      });
    }
  }, [emit]);

  // 外部触发的方法们
  const doPut = useCallback(
    (recipe: (copy: T) => void | T) => {
      const next = produce(data.current, recipe, (patches, inversPatches) => {
        history.current.push(...inversPatches);
        patches.forEach((patch) => {
          emit.change({
            next: patch.value,
            path: patch.path,
            source: uid.current,
          });
        });
      });
      data.current = next as T;
      return next;
    },
    [emit],
  );

  const doReset = useCallback(
    (reset?: T, path?: string) => {
      const next = applyPatches(data.current, history.current.reverse());
      history.current = [];
      redos.current = [];
      data.current = reset ? reset : next;
      emit.reset({ path, replaced: !!reset });
    },
    [emit],
  );

  const doClean = useCallback(
    (path?: string) => {
      emit.clean({ path });
    },
    [emit],
  );

  const doChecking = useCallback((path?: string) => {
    if (path) {
      const checker = checkerQueue.current.find((c) =>
        isMatch(pathMap.current[c.vid], path),
      );
      if (checker && typeof checker.runner === 'function') {
        return checker.runner().then(() => _.get(data.current, path));
      }
      return Promise.resolve(_.get(data.current, path));
    }
    return Promise.all(checkerQueue.current.map((c) => c.runner())).then<T>(
      () => data.current,
    );
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
  const onValidate = useCallback<Event.validate>(
    ({ vid, status }) => {
      validMap.current[vid] = status;
      const computedValid = isValid(validMap.current);
      console.log(validMap.current, validRef.current, computedValid, valid);
      if (computedValid !== validRef.current) {
        setValid(computedValid);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onChange = useCallback<Event.change>(({ next, path, source }) => {
    if (source === uid.current) {
      return;
    }
    const neo = produce(
      data.current,
      (draft) => {
        _.set(draft, path, next);
      },
      (patches, inversPatches) => {
        history.current.push(...inversPatches);
      },
    );
    data.current = neo as T;
  }, []);

  // 事件的注册与销毁
  useEffect(() => {
    on.debug((type, e) => {
      if (typeof effect === 'function') {
        effect(data.current, type.replace(/[^change]/g, ''), e);
      }
    });
    const godie = dying(
      uid.current,
      on.change(onChange),
      on.validate(onValidate),
      on.mounted(onMounted),
      on.unmounted(onUnMounted),
    );

    const id = uid.current;

    return () => {
      godie();
      pool.remove(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proxy = new Proxy(data, {
    get(target, key) {
      if (key === 'current') {
        return Reflect.get(target, key);
      }
      if (key === '__ctx') {
        return ctx;
      }
      return Reflect.get(target.current, key);
    },
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
    valid: typeof valid;
  } = {
    data: proxy,
    reset: doReset,
    put: doPut,
    clean: doClean,
    valid,
    checking: doChecking,
  };
  return ans;
};
