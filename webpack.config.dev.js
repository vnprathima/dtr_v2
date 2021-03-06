const merge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader"
      }
    ]
  },
 
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    port: 3005,
    https: false,
    host: "0.0.0.0",
    public: "0.0.0.0",
    hotOnly: true,
    historyApiFallback: {
      rewrites: [
        { from: /index/, to: "/index.html" },
        // { from: /launch/, to: "/launch.html" },
        // { from: /register/, to: "/register.html" },
        // { from: /priorauth/, to: "/priorauth.html" },
      	// { from: /login/, to: '/login.html' }
      ]
    },
    disableHostCheck: true,
    proxy: [
      {
        context: ["/fetchFhirUri", "/getfile"],
        target: "https://sm.mettles.com/crd",
        changeOrigin: true,
        secure: false
      }
    ]
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
});