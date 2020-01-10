var nodeExternals = require('webpack-node-externals');
const path = require("path");

module.exports = {
  entry: {
    launch: path.resolve(__dirname, "src/launch.js"),
    index: path.resolve(__dirname, "src/index.js"),
    register: path.resolve(__dirname, "src/register.js"),
    login: path.resolve(__dirname, "src/loginPage.js"),
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
  },
  target: 'node', // in order to ignore built-in modules like path, fs, etc. 
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder 
  resolve: { extensions: ["*", ".js", ".jsx"] },
  module: {
    rules: [
      {
        // bit of a hack to ignore the *.js.map files included in cql-execution (from coffeescript)
        test: /\.js.map$/,
        include: [path.resolve(__dirname, "node_modules/cql-execution/lib")],
        use: { loader: "ignore-loader" }
      },
      {
        test: /\.(mjs|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            "presets": [
              [
                "@babel/preset-env",
                {
                  "corejs": "2.0.0",
                  "useBuiltIns": "entry",
                  "targets": {
                    "esmodules": true,
                    "ie": "11"
                  }
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  node: {
    fs: "empty"
  }
};
