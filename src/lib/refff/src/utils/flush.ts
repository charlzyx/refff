import { Pipe } from '@refff/core';

export const flush = <T extends any>(pipes: Pipe[], init: T) => {
  return pipes.reduce<T | undefined>((prev, pipe) => {
    return pipe(prev);
  }, init);
};
