import { Pipe, TFieldMeta, TPipeConfig } from '@refff/core';

const isEmpty = (x: any) => {
  if (Array.isArray(x)) return x.length === 0;
  return true;
};

const pipe = (
  defaults: Required<TPipeConfig>,
  statics: TPipeConfig = {},
  props: TPipeConfig = {}
): Required<TPipeConfig> => {
  // props.order > statics.order > defaults.order
  const order: Required<TPipeConfig>['order'] =
    (isEmpty(props.order)
      ? isEmpty(statics.order)
        ? defaults.order
        : statics.order
      : props.order) || [];
  const pipes = {
    v2c: [] as Pipe[],
    c2v: [] as Pipe[]
  };

  order.forEach(key => {
    switch (key) {
      case 'props':
        pipes.v2c =
          Array.isArray(props.v2c) && !isEmpty(props.v2c)
            ? pipes.v2c.concat(props.v2c)
            : pipes.v2c;
        pipes.c2v =
          Array.isArray(props.c2v) && !isEmpty(props.c2v)
            ? pipes.c2v.concat(props.c2v)
            : pipes.c2v;
        break;
      case 'static':
        pipes.v2c =
          Array.isArray(statics.v2c) && !isEmpty(statics.v2c)
            ? pipes.v2c.concat(statics.v2c)
            : pipes.v2c;
        pipes.c2v =
          Array.isArray(statics.c2v) && !isEmpty(statics.c2v)
            ? pipes.c2v.concat(statics.c2v)
            : pipes.c2v;
        break;
      case 'default':
        pipes.v2c =
          Array.isArray(defaults.v2c) && !isEmpty(defaults.v2c)
            ? pipes.v2c.concat(defaults.v2c)
            : pipes.v2c;
        pipes.c2v =
          Array.isArray(defaults.c2v) && !isEmpty(defaults.c2v)
            ? pipes.c2v.concat(defaults.c2v)
            : pipes.c2v;
        break;
    }
  });

  return {
    v2c: pipes.v2c,
    c2v: pipes.c2v,
    order
  };
};

const isObject = (x: any) =>
  Object.prototype.toString.call(x) === '[object Object]';
const mapping = (
  defaults: Required<TFieldMeta>,
  ...mappings: (TFieldMeta | void)[]
): Required<TFieldMeta> => {
  return mappings.reduce<Required<TFieldMeta>>((map, m) => {
    if (isObject(m)) {
      return { ...map, ...m };
    }
    return map;
  }, defaults);
};

export const merge = {
  pipe,
  mapping
};
