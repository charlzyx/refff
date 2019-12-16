import moment, { Moment } from 'moment';

import { DatePicker } from 'antd';
import { link } from '@refff/core';

const { RangePicker: AntdRangePicker } = DatePicker;

const RangePicker = link(AntdRangePicker, {
  pipe: {
    v2c: [
      (range: any) => {
        return [moment(range[0]), moment(range[1])];
      }
    ],
    c2v: [
      (range: Moment[], props) => {
        const formats = Array.isArray(props.format)
          ? [props.format[0] || 'YYYY-MM-DD', props.format[1] || 'YYYY-MM-DD']
          : [props.format || 'YYYY-MM-DD', props.format || 'YYYY-MM-DD'];
        return [
          moment(range[0]).format(formats[0]),
          moment(range[1]).format(formats[1])
        ];
      }
    ]
  }
});

export { RangePicker };
