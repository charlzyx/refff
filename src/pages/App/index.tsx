import { Button, Input, RangePicker } from '@/lib/antd';
import { Field, Form, useForm } from '@refff/core';
/* eslint-disable no-console */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

const init = {
  a: 1,
  b: {
    c: {
      d: 2
    }
  },
  start: '2019-10-20',
  end: '2019-12-10'
};

const App = () => {
  const { data, clean, valid, put, checking, reset } = useForm(
    init,
    (...args) => {
      console.table(args);
    }
  );

  return (
    <div>
      <Form data={data}>
        <div>{valid ? 'valid' : 'notvalid'}</div>
        <Field label="Hello" path={data.a}>
          <Input></Input>
        </Field>
        <Field label="World" path="b.c.d">
          <Input></Input>
        </Field>
        <Field path={[data.start, data.end]} label="datarange">
          <RangePicker format="YYYY-MM-DD HH:mm:ss"></RangePicker>
        </Field>
      </Form>
    </div>
  );
};

export default App;
