const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.js', // This should point to your main JavaScript file.
  output: {
    path: path.resolve(__dirname, 'dist'), // The output directory for the build.
    filename: 'bundle.js' // The name of the output file containing your bundled code.
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'), // Path to your index.html
      filename: 'index.html' // The output file name (it usually remains index.html).
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // This loader is required to handle JavaScript (React) files.
          options: {
            presets: ['@babel/preset-react'] // This preset is needed for React code.
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'] // These loaders are used for processing CSS files.
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              context: 'src', // The context for the files.
            },
          },
        ],
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 8080,
  },
};
