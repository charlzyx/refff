import {
  DeepReadonly,
  Effects,
  Event,
  PathMap,
  ValidMap,
  ValidateStatus,
} from '@refff/core';
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
  // 初始值
  const data = useRef<T>(init);
  // 实时校验结果
  const [valid, setValid, validRef] = useRefState(false);
  // vid: validStatus
  const validMap = useRef<ValidMap>({});
  // vid: path
  const pathMap = useRef<PathMap>({});
  // vid, runner[]
  const checkerQueue = useRef<{ vid: string; runner: Event.validator }[]>([]);
  // form context
  const ctx = useRef<TCtx>({
    config: {},
    data,
    fid: uid.current,
  });
  // history
  const history = useRef<Patch[]>([]);
  // redos
  const redos = useRef<Patch[]>([]);
  // events manager
  const { emit, on } = pool.get(uid.current);

  /**
   * WIP: 时光旅行, 太难了, 写不出来
   */
  // const undo = useCallback(() => {}, []);
  // const redo = useCallback(() => {}, []);

  // 加载完成, 广播最新值
  const doInit = useCallback(
    (next: T) => {
      emit.init({ next });
    },
    [emit],
  );
  // 外部修改字段值
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
      // if (effect) effect(data.current, 'change');
      return next;
    },
    [emit],
  );

  // 清理校验状态
  const doClean = useCallback(
    (path?: string) => {
      emit.clean({ path });
    },
    [emit],
  );
  // 重置表单值
  const doReset = useCallback(
    (reset?: T, withValid?: boolean, path?: string) => {
      // 只有内部调用才有 path
      if (path) {
        emit.reset({ path, replaced: !!reset, withValid });
      } else {
        const next = applyPatches(data.current, history.current.reverse());
        history.current = [];
        redos.current = [];
        data.current = reset ? reset : next;
        setTimeout(() => {
          emit.reset({ path, replaced: !!reset, withValid });
        });
      }
    },
    [emit],
  );

  const outReset = useCallback(
    (reset?: T, withValid?: boolean) => {
      doReset(reset, withValid);
    },
    [doReset],
  );

  // 进行异步校验
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
    return Promise.all(checkerQueue.current.map((c) => c.runner())).then(
      () => data.current,
    );
  }, []);

  // 监听者们
  // 挂载 Field
  const onMounted = useCallback<Event.mounted>(
    ({ vid, path, checker, validStatus }) => {
      pathMap.current[vid] = path;
      if (!!validStatus) {
        validMap.current[vid] = validStatus as ValidateStatus;
      } else {
        delete validMap.current[vid];
      }
      // 更新 valid
      const computedValid = isValid(validMap.current);
      if (computedValid !== validRef.current) {
        setValid(computedValid);
      }
      const found = checkerQueue.current.findIndex((c) => c.vid === vid);
      if (found > -1) {
        checkerQueue.current[found] = { vid, runner: checker };
      } else {
        checkerQueue.current.push({ vid, runner: checker });
      }
    },
    [setValid, validRef],
  );
  // 卸载 Field
  const onUnMounted = useCallback<Event.unmounted>(
    ({ vid }) => {
      delete pathMap.current[vid];
      delete validMap.current[vid];
      // 更新 valid
      const computedValid = isValid(validMap.current);
      if (computedValid !== validRef.current) {
        setValid(computedValid);
      }
      checkerQueue.current = checkerQueue.current.filter((x) => x.vid === vid);
    },
    [setValid, validRef],
  );
  // 校验 Field
  const onValidate = useCallback<Event.validate>(
    ({ vid, status }) => {
      validMap.current[vid] = status;
      const computedValid = isValid(validMap.current);
      if (computedValid !== validRef.current) {
        setValid(computedValid);
      }
    },
    [setValid, validRef],
  );
  // 值变化 Field
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
    on.all((type, e) => {
      if (typeof effect === 'function') {
        if (/change/.test(type)) {
          effect(data.current, 'change', e);
        }
        if (/reset/.test(type)) {
          effect(data.current, 'reset', e);
        }
      }
    });
    const godie = dying(
      uid.current,
      on.change(onChange),
      on.validate(onValidate),
      on.mounted(onMounted),
      on.unmounted(onUnMounted),
    );
    setTimeout(() => {
      doInit(data.current);
    });

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
  }) as DeepReadonly<T & { __ctx: typeof ctx; current: typeof data.current }>;

  type OverChecking = {
    (path: string): Promise<Partial<T>>;
    (): Promise<T>;
  };
  const ans: {
    data: typeof proxy;
    reset: typeof outReset;
    put: typeof doPut;
    clean: typeof doClean;
    checking: OverChecking;
    valid: typeof valid;
  } = {
    data: proxy,
    reset: outReset,
    put: doPut,
    clean: doClean,
    valid,
    checking: doChecking,
  };
  return ans;
};
