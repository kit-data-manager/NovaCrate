const webpack = require("webpack")
const path = require("path")

const config = {
    entry: "./lib/crate-verify/index.ts",
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "crate-verify-worker.js"
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.webworker.json"
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".ts", ".js"]
    }
}

module.exports = config
