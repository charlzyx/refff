import { Events } from '@refff/core';
import mitt from 'mitt';

const getTypes = (id: string) => ({
  change: id + '_change',
  reset: id + '_reset',
  clean: id + '_clean',
  validate: id + '_validate',
  mounted: id + '_mounted',
  unmounted: id + '_unmounted'
});

const emitter: mitt.Emitter = mitt();

const events = (id: string): Events => {
  const types = getTypes(id);
  return {
    on: {
      debug(fn) {
        emitter.on('*', fn);
      },
      change(fn) {
        emitter.on(types.change, fn);
        return () => {
          emitter.off(types.change, fn);
        };
      },
      reset(fn) {
        emitter.on(types.reset, fn);
        return () => {
          emitter.off(types.reset, fn);
        };
      },
      clean(fn) {
        emitter.on(types.clean, fn);
        return () => {
          emitter.off(types.clean, fn);
        };
      },
      mounted(fn) {
        emitter.on(types.mounted, fn);
        return () => {
          emitter.off(types.mounted, fn);
        };
      },
      unmounted(fn) {
        emitter.on(types.unmounted, fn);
        return () => {
          emitter.off(types.unmounted, fn);
        };
      },
      validate(fn) {
        emitter.on(types.validate, fn);
        return () => {
          emitter.off(types.validate, fn);
        };
      }
    },
    emit: {
      change(e) {
        emitter.emit(types.change, e);
      },
      reset(e) {
        emitter.emit(types.reset, e);
      },
      clean(e) {
        emitter.emit(types.clean, e);
      },
      mounted(e) {
        emitter.emit(types.mounted, e);
      },
      unmounted(e) {
        emitter.emit(types.unmounted, e);
      },
      validate(e) {
        emitter.emit(types.validate, e);
      }
    }
  };
};

type Pool = {
  cache: { [id: string]: Events };
  get: (id: string) => Events;
};

export const pool: Pool = {
  cache: {},
  get(id: string) {
    if (this.cache[id]) {
    } else {
      this.cache[id] = events(id);
    }
    return this.cache[id];
  }
};

const disposer: {
  [id: string]: Function[];
} = {};

export const dying = (id: string, ...args: Function[]) => {
  if (!disposer[id]) {
    disposer[id] = [];
  }
  disposer[id].push(...args);
  return () => {
    disposer[id].forEach(fn => {
      if (typeof fn === 'function') {
        fn();
      }
    });
  };
};
