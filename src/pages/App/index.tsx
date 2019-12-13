import { Field, Form, useForm } from '@refff/core';
/* eslint-disable no-console */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/lib/antd';

const App = () => {
  const { data, clean, valid, put, checking, reset } = useForm(
    {
      a: 1,
      b: {
        c: {
          d: 2
        }
      },
      start: '',
      end: ''
    },
    (...args) => {
      console.log('somthing', args);
    },
    dd => {
      return { ...dd, range: [dd.start, dd.end] };
    },
    next => {
      delete next.range;
      return next;
    }
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
