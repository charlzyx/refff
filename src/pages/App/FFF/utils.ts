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

export const noop = (): any => {};
export const noopnoop = () => noop;
