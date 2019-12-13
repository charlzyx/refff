export const thenable = (x: any) => {
  return x ? x instanceof Promise || typeof x.then === 'function' : false;
};

export const promisify = (fn: Function): Promise<string | void> => {
  try {
    const ans = fn();
    if (thenable(ans)) {
      return ans;
    } else {
      return Promise.resolve(ans);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
