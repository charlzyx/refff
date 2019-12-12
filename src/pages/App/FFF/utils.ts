import {
  Dispatch,
  EventHandler,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState
} from 'react';

import _ from 'lodash';

export const flush = (fns: any[]) => {
  fns.forEach(fn => {
    if (typeof fn === 'function') {
      fn();
    }
  });
};

type Path = string | number;

export const isPathContain = (
  shorter: Path | Path[],
  longer: Path | Path[]
) => {
  if (!shorter || !longer) return false;
  if (shorter === longer) return true;
  const short = _.toPath(shorter);
  const long = _.toPath(longer);
  if (short.length > long.length) {
    return false;
  }
  let i = 0;
  while (i < short.length) {
    if (short[i] !== long[i]) {
      return false;
    }
    i++;
  }
  return true;
};

export const thenable = (x: any) => {
  return x ? x instanceof Promise || typeof x.then === 'function' : false;
};

export const promisify = (fn: Function): Promise<string | void> => {
  try {
    const ans = fn();
    if (thenable(ans)) {
      return ans;
    } else {
      return Promise.resolve(ans);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

export const noop = (): any => {};
export const noopnoop = () => noop;

const get = <S>(init: S | (() => S)): S => {
  if (init instanceof Function) {
    return init();
  }
  return init;
};

export const useRefState = <S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, MutableRefObject<S>] => {
  const ref = useRef(get(initialState));
  const [state, setState] = useState(() => {
    const value = get(initialState);
    ref.current = value;
    return value;
  });

  const setValue = useCallback<typeof setState>(next => {
    if (next instanceof Function) {
      setState(prev => {
        const nextValue = next(prev);
        ref.current = nextValue;
        return nextValue;
      });
    } else {
      ref.current = next;
      setState(next);
    }
  }, []);
  return [state, setValue, ref];
};

export const getEventValue = <T = any>(e: T | { target: { value: T } }) => {
  // Duck Type, 如果它长的比较像 Event, 那就认为是个 event 吧
  const isEvent =
    e &&
    (e as any).target &&
    typeof (e as any).preventDefault === 'function' &&
    typeof (e as any).stopPropagation === 'function';

  return isEvent ? (e as any).target.value : e;
};
