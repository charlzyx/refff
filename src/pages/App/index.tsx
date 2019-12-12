import './settings';

import { Field, Form } from './FFF';
/* eslint-disable no-console */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Input } from 'antd';

const App = () => {
  const data = useRef({ a: 1, b: { c: 2 } });
  const actions = useRef<Parameters<typeof Form>['0']['actions']>();
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <Form
        init={data.current}
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        actions={actions}
      >
        <Field label="hh" __path="a">
          <Input></Input>
        </Field>
        <Field label="hh" __path="b.c">
          <Input></Input>
        </Field>
      </Form>
    </div>
  );
};

export default App;
