const baseConfig = require('./webpack.base');
const { merge } = require('webpack-merge');


module.exports = merge(baseConfig, {
    mode: 'development'
});
