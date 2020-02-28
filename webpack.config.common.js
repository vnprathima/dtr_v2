const path = require("path");

const aggregateTranslations = require('terra-aggregate-translations');

const aggregateOptions = {
    baseDir: __dirname,
    // excludes: ['./node_modules/packageToExclude'],
    locales: ['en', 'en-US'],
    format: 'es6',
};

aggregateTranslations(aggregateOptions);

module.exports = {
  entry: {
    launch: path.resolve(__dirname, "src/launch.js"),
    index: path.resolve(__dirname, "src/index.js"),
    login: path.resolve(__dirname, "src/login.js"),
    register: path.resolve(__dirname, "src/register.js"),
    priorauth: path.resolve(__dirname, "src/priorauth.js")
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/"
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    modules: [path.resolve(__dirname, 'aggregated-translations'), 'node_modules'],
  },
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
            presets: [
              [
                "@babel/env",
                {
                  corejs: "2.0.0",
                  useBuiltIns: "entry"
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        use: [{
          loader: "style-loader"
        },
        {
          loader: "css-loader",
          options: {
            modules: true,
            sourceMap: true
          }
        },
        {
          loader: "sass-loader",
        }]
      }
    ]
  },
  node: {
    fs: "empty"
  }
};
