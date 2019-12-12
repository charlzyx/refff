import AsyncValidator from 'async-validator';
import { Form } from 'antd';
import { settings } from '@refff/core';

const { Item } = Form;

settings.UI.Field = Item;
settings.UI.Form = Form;
settings.validator = (ref, rule, label = '') => {
  const checker = new AsyncValidator({ [label]: rule });
  const value = ref.current;
  const waitValidate = { [label]: value };
  return checker.validate(waitValidate);
};
