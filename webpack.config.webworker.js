const webpack = require("webpack")
const path = require("path")

const config = {
    entry: "./lib/schema-worker/index.ts",
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "schema-worker.js"
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
