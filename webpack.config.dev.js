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
              loader:'babel-loader',
              exclude: /node_modules/
          }
      ]
  },
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    port: 3005,
    https: false,
    public: "0.0.0.0",
    hotOnly: true,
    historyApiFallback: {
        rewrites: [
          { from: /index/, to: '/index.html' },
          { from: /launch/, to: '/launch.html' },
          { from: /login/, to: '/login.html' }
        ]
      },
    proxy: [{
      context: ['/fetchFhirUri', '/getfile'],
      target: 'http://localhost:8090/',
      changeOrigin: true,
      secure: false
    }],
    
    disableHostCheck: true	

  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
});