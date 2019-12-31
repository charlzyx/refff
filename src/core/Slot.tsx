import React, { FC } from 'react';

type Props<T extends object = object> = {
  data: T;
};

const Slot: FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export { Slot };
