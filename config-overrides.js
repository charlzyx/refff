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
  addBabelPlugin([
    './lib/babel/transform-refff', {
      include: /Form|Field/,
    }
  ]),
  addBabelPlugin(['lodash']),
  addBabelPlugin(['@babel/plugin-proposal-optional-chaining']),
  addWebpackAlias({
    '@': path.resolve(__dirname, './src'),
    '@refff/core': path.resolve(__dirname, './src/lib/refff/src')
  }),
  addLessLoader({
    javascriptEnabled: true
  })
);
