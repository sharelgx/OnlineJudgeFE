'use strict'
// Template version: 1.1.1
// see http://vuejs-templates.github.io/webpack for documentation.

const path = require('path')
const commonProxy = {
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Referer', process.env.TARGET)
  },
  target: process.env.TARGET,
  changeOrigin: true
}

module.exports = {
  build: {
    env: require('./prod.env'),
    ojIndex: path.resolve(__dirname, '../dist/index.html'),
    ojTemplate: path.resolve(__dirname, '../src/pages/oj/index.html'),
    adminIndex: path.resolve(__dirname, '../dist/admin/index.html'),
    adminTemplate: path.resolve(__dirname, '../src/pages/admin/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: process.env.USE_SENTRY === '1',
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    bundleAnalyzerReport: process.env.npm_config_report
  },
  dev: {
    env: require('./dev.env'),
    port: process.env.PORT || 8080,
    autoOpenBrowser: true,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      "/api": commonProxy,
      "/public": commonProxy
    },
    cssSourceMap: false
  }
}
