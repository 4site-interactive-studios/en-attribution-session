 const path = require('path');
 const { CleanWebpackPlugin } = require("clean-webpack-plugin");
 const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
 const ESLintPlugin = require("eslint-webpack-plugin");

 module.exports = {
   entry: {
    app: './src/index.ts',
    mode: "development",
    devtool: "source-map",
    optimization: {
        usedExports: true,
    },
   },
   plugins: [
     new HtmlWebpackPlugin({
       title: 'Production',
     }),
   ],
   output: {
     filename: 'en-session-attribution.js',
     path: path.resolve(__dirname, 'dist'),
     clean: true,
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