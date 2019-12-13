import { FieldMapping, Pipe, PipeConfig } from '@refff/core';

const isEmpty = (x: any) => {
  if (Array.isArray(x)) return x.length === 0;
  return true;
};

const pipe = (
  defaults: Required<PipeConfig>,
  statics: PipeConfig = {},
  props: PipeConfig = {}
): Required<PipeConfig> => {
  // props.order > statics.order > defaults.order
  const order: Required<PipeConfig>['order'] =
    (isEmpty(props.order)
      ? isEmpty(statics.order)
        ? defaults.order
        : statics.order
      : props.order) || [];
  const pipes = {
    to: [] as Pipe[],
    by: [] as Pipe[]
  };

  order.forEach(key => {
    switch (key) {
      case 'props':
        pipes.to =
          Array.isArray(props.to) && !isEmpty(props.to)
            ? pipes.to.concat(props.to)
            : pipes.to;
      case 'static':
        pipes.to =
          Array.isArray(statics.to) && !isEmpty(statics.to)
            ? pipes.to.concat(statics.to)
            : pipes.to;
      case 'default':
        pipes.to =
          Array.isArray(defaults.to) && !isEmpty(defaults.to)
            ? pipes.to.concat(defaults.to)
            : pipes.to;
    }
  });

  return {
    to: pipes.to,
    by: pipes.by,
    order
  };
};

const isObject = (x: any) =>
  Object.prototype.toString.call(x) === '[object Object]';
const mapping = (
  defaults: Required<FieldMapping>,
  ...mappings: (FieldMapping | void)[]
): Required<FieldMapping> => {
  return mappings.reduce<Required<FieldMapping>>((map, m) => {
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
