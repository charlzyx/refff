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

export const getEventValue = <T = any>(e: T | { target: { value: T } }) => {
  // Duck Type, 如果它长的比较像 Event, 那就认为是个 event 吧
  const isEvent =
    e &&
    (e as any).target &&
    typeof (e as any).preventDefault === 'function' &&
    typeof (e as any).stopPropagation === 'function';

  return isEvent ? (e as any).target.value : e;
};
