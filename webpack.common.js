 const path = require('path');
 const { CleanWebpackPlugin } = require("clean-webpack-plugin");
 const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
 const ESLintPlugin = require("eslint-webpack-plugin");

 module.exports = {
    entry: "./src/en-session-attribution.ts",
    mode: "development",
    devtool: "source-map",
    optimization: {
        usedExports: "global",
    },
    output: {
        filename: 'en-session-attribution.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        // disable type checker - we will use it in fork plugin
                        transpileOnly: true,
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    plugins: [
        new CleanWebpackPlugin(),
        new ForkTsCheckerWebpackPlugin(),
        new ESLintPlugin({
            extensions: [".tsx", ".ts", ".js"],
            exclude: "node_modules",
        }),
    ],
 };