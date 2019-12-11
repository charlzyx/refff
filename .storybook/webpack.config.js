const path = require("path");

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.less$/,
    use: [
      "style-loader",
      "css-loader",
      {
        loader: require.resolve("postcss-loader"),
        options: {
          ident: "postcss",
          plugins: () => [
            require("postcss-flexbugs-fixes"),
            require("postcss-preset-env")({
              autoprefixer: { flexbox: "no-2009" },
              stage: 3
            })
          ]
        }
      },
      {
        loader: "less-loader",
        options: {
          javascriptEnabled: true
        }
      }
    ]
  });

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    exclude: /node_modules/,
    use: [
      {
        loader: require.resolve("babel-loader"),
        options: {
          presets: [["react-app", { flow: false, typescript: true }]],
          plugins: [
            [
              path.resolve(
                __dirname,
                "../lib/babel-plugin-transform-react-jsx-path-to-__path"
              ),
              { include: /Field|Watch/ }
            ]
          ]
        }
      },
      {
        loader: require.resolve("react-docgen-typescript-loader")
      }
    ]
  });

  config.resolve.alias = Object.assign(config.resolve.alias, {
    "@": path.resolve(__dirname, "../src")
  });

  config.resolve.extensions.push(".ts", ".tsx");
  return config;
};
