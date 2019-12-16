import { Path } from '@refff/core';
import _ from 'lodash';

export const isMatch = (shorter: Path | Path[], longer: Path | Path[]) => {
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

export const getValueByPath = (data: any, path: Path | [Path, Path][]) => {
  if (!Array.isArray(path)) return _.get(data, path);
  const isArray = typeof path[0][0] === 'number';
  // 创建初始对象
  const value: any = isArray ? [] : {};
  path.forEach(pair => {
    const [p1, p2] = pair;
    value[p1] = _.get(data, p2);
  });
  return value;
};

export const getDepsByPath = (path: Path | [Path, Path][]) => {
  if (Array.isArray(path)) {
    return path.map(pair => pair[1] as string);
  } else {
    return path;
  }
};

export const isDepsMatched = (path: Path | Path[], deps: Path | Path[]) => {
  if (Array.isArray(deps)) {
    return deps.find(dep => isMatch(dep, path));
  } else {
    return isMatch(deps, path);
  }
};
