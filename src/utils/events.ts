import { Events } from '@refff/core';

const getTypes = (id: string) => ({
  change: `${id}_change`,
  reset: `${id}_reset`,
  clean: `${id}_clean`,
  validate: `${id}_validate`,
  init: `${id}_init`,
  mounted: `${id}_mounted`,
  unmounted: `${id}_unmounted`,
});

const emitter: {
  watchers: {
    [x: string]: Function[];
  };
  on: (type: string, fn: Function) => void;
  off: (type: string, fn: Function) => void;
  emit: (type: string, e: any) => void;
} = {
  watchers: {},
  on(type: string, fn: Function) {
    this.watchers[type] = this.watchers[type] || [];
    const found = this.watchers[type].findIndex((x: any) => x === fn);
    if (found === -1) {
      this.watchers[type].push(fn);
    }
  },
  off(type: string, fn: Function) {
    if (!Array.isArray(this.watchers[type])) return;
    let i = 0;
    while (i < this.watchers[type].length) {
      if (this.watchers[type][i] === fn) {
        this.watchers[type].splice(i, 1);
      }
      i++;
    }
  },
  emit(type: string, e: any) {
    if (!Array.isArray(this.watchers[type])) return;
    let i = 0;
    while (i < this.watchers[type].length) {
      this.watchers[type][i](e);
      i++;
    }
    if (!Array.isArray(this.watchers['*'])) return;
    let idx = 0;
    while (idx < this.watchers['*'].length) {
      this.watchers['*'][idx](type, e);
      idx++;
    }
  },
};

const events = (id: string): Events => {
  const types = getTypes(id);
  return {
    on: {
      all(fn) {
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
      init(fn) {
        emitter.on(types.init, fn);
        return () => {
          emitter.off(types.init, fn);
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
      },
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
      init(e) {
        emitter.emit(types.init, e);
      },
      mounted(e) {
        emitter.emit(types.mounted, e);
      },
      unmounted(e) {
        emitter.emit(types.unmounted, e);
      },
      validate(e) {
        emitter.emit(types.validate, e);
      },
    },
  };
};

type Pool = {
  cache: { [id: string]: Events };
  get: (id: string) => Events;
  remove: (id: string) => void;
};

export const pool: Pool = {
  cache: {},
  get(id: string) {
    if (this.cache[id]) {
    } else {
      this.cache[id] = events(id);
    }
    return this.cache[id];
  },
  remove(id: string) {
    delete this.cache[id];
  },
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
    disposer[id].forEach((fn) => {
      if (typeof fn === 'function') {
        fn();
      }
    });
  };
};
