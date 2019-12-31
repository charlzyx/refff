import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';

const get = <S>(init: S | (() => S)): S => {
  if (init instanceof Function) {
    return init();
  }
  return init;
};

export const useRefState = <S>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>, MutableRefObject<S>] => {
  const ref = useRef(get(initialState));
  const [state, setState] = useState(() => {
    const value = get(initialState);
    ref.current = value;
    return value;
  });

  const setValue = useCallback<typeof setState>((next) => {
    if (next instanceof Function) {
      setState((prev) => {
        const nextValue = next(prev);
        ref.current = nextValue;
        return nextValue;
      });
    } else {
      ref.current = next;
      setState(next);
    }
  }, []);
  return [state, setValue, ref];
};
