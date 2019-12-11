const path = require('path');
const {
  override,
  fixBabelImports,
  addWebpackAlias,
  addLessLoader,
  addBabelPlugin
} = require('customize-cra');

module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: false
  }),
  // addBabelPlugin([
  //   './lib/babel-plugin-transform-react-jsx-path-to-__path',
  //   {
  //     include: /Field|Watch/
  //   }
  // ]),
  addBabelPlugin(['lodash']),
  addBabelPlugin(['@babel/plugin-proposal-optional-chaining']),
  addWebpackAlias({
    '@': path.resolve(__dirname, './src')
  }),
  addLessLoader({
    javascriptEnabled: true
  })
);
