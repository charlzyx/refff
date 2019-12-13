/**
 * 暂时不需要定制主题, 所以直接引入 css 加速打包
 * 需要定制了, 再去 global.less 里面做修改
 */

import 'antd/dist/antd.css';
import '@/lib/antd/settings';

import * as serviceWorker from './serviceWorker';

import React from 'react';
import ReactDOM from 'react-dom';
import Root from './pages/App';

ReactDOM.render(<Root />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
