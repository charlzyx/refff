import { Button, Input } from '@/lib/antd';
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
  start: '',
  end: ''
};

const converter = (data: typeof init) => {
  return { ...data, range: [data.start, data.end] };
};

const recovery = (next: ReturnType<typeof converter>) => {
  delete next.range;
  return next;
};

const App = () => {
  const { data, clean, valid, put, checking, reset } = useForm(
    init,
    (...args) => {
      // console.log('somthing', args);
    },
    converter,
    recovery
  );

  return (
    <div>
      <Form data={data}>
        <div>{valid ? 'valid' : 'notvalid'}</div>
        <Field label="Hello" __path="a">
          <Input></Input>
        </Field>
        <Field label="World" __path="b.c.d">
          <Input></Input>
        </Field>
        <Field label="World" __path="range">
          <Input></Input>
        </Field>
      </Form>
    </div>
  );
};

export default App;
