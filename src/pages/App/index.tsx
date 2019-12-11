/* eslint-disable no-console */
import React, { FC, useCallback, useEffect, useState } from 'react';

import { Button } from 'antd';
import useForm from './FFF/useForm';

const Box = () => {
  const { data, put, undo, redo } = useForm({ a: 1, b: { c: 1 } });

  const [, forceUpdate] = useState(0);
  const add = useCallback(() => {
    put(x => {
      x.b.c++;
    });
    forceUpdate(+new Date());
  }, []);

  const actUndo = useCallback(() => {
    undo();
    forceUpdate(+new Date());
  }, []);

  const actRedo = useCallback(() => {
    redo();
    forceUpdate(+new Date());
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <Button onClick={add} type="primary">
        ++
      </Button>
      <Button onClick={actUndo}>undo</Button>
      <Button onClick={actRedo}>redo</Button>
    </div>
  );
};

export default Box;
