/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable prettier/prettier */
import { RuleItem } from 'async-validator';

import { FormProps, FormItemProps } from 'antd/es/form';
// import original module declarations
import '@refff/core';

// and extend them!
export declare module '@refff/core' {
  export interface Rule extends RuleItem{};

  export interface FormProps extends FormProps{};
  export interface FiledProps extends FormItemProps{};
  export interface NoticeProps {
    nothing: string;
  }
}
