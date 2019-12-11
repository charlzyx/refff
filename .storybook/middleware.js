const proxy = require('http-proxy-middleware')
const config = require('../package.json')

// "proxy": "http://localhost:2333",

module.exports = function expressMiddleware(router) {
  if (config.proxy) {
    router.use('/mock', proxy({ target: config.proxy }));
  }
}