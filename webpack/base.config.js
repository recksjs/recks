const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, '../dist'),
        library: 'recks',
        libraryTarget: 'umd',
        publicPath: '/dist/',
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: [
        // externalisation of rxjs
        // copied from https://github.com/jayphelps/webpack-rxjs-externals/
        function rxjsExternals(context, request, callback) {
            if (request.match(/^rxjs(\/|$)/)) {
                const parts = request.split('/');

                return callback(null, {
                    root: parts,
                    commonjs: request,
                    commonjs2: request,
                    amd: request
                });
            }

            callback();
        }
    ],
    plugins: [
        new CleanWebpackPlugin()
    ]
};
