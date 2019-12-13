import { Field, Form, useForm } from '@refff/core';
/* eslint-disable no-console */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/lib/antd';

const App = () => {
  const { data, clean, put, checking, reset } = useForm(
    {
      a: 1,
      b: {
        c: {
          d: 2
        }
      }
    },
    (...args) => {
      console.log('efffects', args);
    }
  );
  return (
    <div>
      <Form data={data}>
        <Field label="Hello" __path="a">
          <Input></Input>
        </Field>
        <Field label="World" __path="b.c.d">
          <Input></Input>
        </Field>
      </Form>
    </div>
  );
};

export default App;
