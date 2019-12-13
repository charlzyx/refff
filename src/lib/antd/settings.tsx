import AsyncValidator from 'async-validator';
import { Form } from 'antd';
import { settings } from '@refff/core';

const { Item } = Form;
const isEvent = (e: any) => {
  if (e instanceof Event) {
    return e;
  } else if (e.target && e.stopPropagation && e.preventDefault) {
    return e as Event;
  } else {
    return false;
  }
};

settings.set.UI.Field(Item);
settings.set.UI.Form(Form);
settings.set.validator((ref, rule, label = '') => {
  const checker = new AsyncValidator({ [label]: rule });
  const value = ref.current;
  const waitValidate = { [label]: value };
  return checker.validate(waitValidate);
});
settings.set.pipe({
  to: [],
  by: [
    x => {
      if (isEvent(x)) return x.target.value;
      return x;
    }
  ],
  order: ['default', 'static', 'props']
});
