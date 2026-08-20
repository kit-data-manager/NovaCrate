const webpack = require("webpack")
const path = require("path")
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin

const config = {
    entry: { schema: "./lib/schema-worker/index.ts", opfs: "./lib/opfs-worker/index.ts" },
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "[name]-worker.js"
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
        extensions: [".ts", ".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, ".")
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.BASE_PATH": JSON.stringify(process.env.BASE_PATH || ""),
            "process.env.__NEXT_ROUTER_BASEPATH": JSON.stringify(process.env.BASE_PATH || "")
        })
        // new BundleAnalyzerPlugin({ enabled: process.env.ANALYZE === "true" })
    ]
}

module.exports = config
