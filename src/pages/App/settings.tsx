import AsyncValidator, { ErrorList, Rules } from 'async-validator';

import { Form } from 'antd';
import { settings } from './FFF/settings';

const { Item } = Form;

settings.UI.Field = Item;
settings.UI.Form = Form;
settings.validator = (ref, rule, label = '') => {
  const validator = new AsyncValidator(({ [label]: rule } as unknown) as Rules);
  const value = ref.current;
  const waitValidate = { [label]: value };
  return validator.validate(waitValidate);
};
