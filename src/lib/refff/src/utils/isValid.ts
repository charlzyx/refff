import { ValidMap } from '@refff/core';

export const isValid = (map: ValidMap) => {
  return Object.values(map).every(v => v === 'success');
};
