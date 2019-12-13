import { Pipe } from '@refff/core';

export const flush = <T extends any>(init: T, pipes: Pipe[]) => {
  return pipes.reduce<T | undefined>((prev, pipe) => {
    return pipe(prev);
  }, init);
};
