const merge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");
// const common = require("./webpack.config.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// Import the terra-toolkit configuration.
const defaultWebpackConfig = require("terra-toolkit/config/webpack/webpack.config");

// Create the app-level configuration
const appWebpackConfig = () => ({
  entry: {
    launch: path.resolve(__dirname, "src/launch.js"),
    index: path.resolve(__dirname, "src/index.js"),
    register: path.resolve(__dirname, "src/register.js"),
    priorauth: path.resolve(__dirname, "src/priorauth.js")
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/"
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".tsx"],
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader"
      },
      {
        // bit of a hack to ignore the *.js.map files included in cql-execution (from coffeescript)
        test: /\.js.map$/,
        include: [path.resolve(__dirname, "node_modules/cql-execution/lib")],
        use: { loader: "ignore-loader" }
      },
      {
        test: /\.tsx$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(mjs|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/env",
                {
                  corejs: 3,
                  useBuiltIns: "entry"
                }
              ]
            ]
          }
        }
      }
    ]
  },
  node: {
    fs: "empty"
  },
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    port: 3005,
    https: false,
    host: "0.0.0.0",
    public: "0.0.0.0",
    historyApiFallback: {
      rewrites: [
        { from: /index/, to: "/index.html" },
        { from: /launch/, to: "/launch.html" },
        { from: /register/, to: "/register.html" },
        { from: /priorauth/, to: "/priorauth.html" }
      ]
    },
    disableHostCheck: true,
    proxy: [
      {
        context: ["/fetchFhirUri", "/getfile"],
        target: "https://sm.mettles.com/crd",
        // target: "http://localhost:8090",
        changeOrigin: true,
        secure: false
      }
    ]
  },
  plugins: [new webpack.HotModuleReplacementPlugin(), new HtmlWebpackPlugin({
    title: "Smart App"
  })]
});

// combine the configurations using webpack-merge
const mergedConfig = (env, argv) => (
  merge(defaultWebpackConfig(env, argv), appWebpackConfig(env, argv))
);

module.exports = mergedConfig;
