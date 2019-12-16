import { Pipe } from '@refff/core';

export const flush = <T extends any>(init: T, props: any, pipes: Pipe[]) => {
  return pipes.reduce<T | undefined>((prev, pipe) => {
    return pipe(prev, props);
  }, init);
};
