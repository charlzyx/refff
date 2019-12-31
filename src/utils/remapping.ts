import { TFieldMeta } from '@refff/core';

export const remapping = <T extends object = Record<string, any>>(
  o: object,
  mapping: Required<TFieldMeta['child'] | TFieldMeta['field']>,
): T => {
  const init: T = {} as T;
  const result = Object.keys(mapping).reduce<T>((next, key) => {
    const remapkey =
      mapping[key as keyof (TFieldMeta['child'] | TFieldMeta['field'])];
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    next[remapkey] = o[key];
    return next;
  }, init);
  return result;
};
