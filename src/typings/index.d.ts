import { RuleItem } from 'async-validator';

import { FormProps, FormItemProps } from 'antd/es/form';
// import original module declarations
import '@refff/core';

// and extend them!
export declare module '@refff/core' {
  export type Rule = RuleItem;

  export type FormProps = FormProps;
  export type FiledProps = FormItemProps;
  export interface NoticeProps {
    nothing: string;
  }
}
