const baseConfig = require('./base.config');
const merge = require('webpack-merge');


module.exports = merge.strategy({
    'module.rules': 'append'
})(baseConfig, {
    mode: 'production'
});
