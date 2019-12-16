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
