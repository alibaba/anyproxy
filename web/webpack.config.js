const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractCss = new ExtractTextPlugin('[name].css', {
  disable: false,
  allChunks: true
});

// a plugin to set the environment
const defineProperty = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'test')
  }
});

module.exports = {
  entry: ['whatwg-fetch', 'babel-polyfill', path.join(__dirname, './src/index.jsx')],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js'
  },
  resolve: {
    root: path.join(__dirname, 'src'),
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'stage-0']
      }
    },
    {
      test: /\.jsx$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'stage-0', 'react'],
        plugins: ['transform-runtime', ['import', { libraryName: 'antd', style: true }]]
      }
    },
    {
      test: function (filePath) {
        return (/antd\/.*\.less$/.test(filePath) || /\.global\.less$/.test(filePath));
      },
      loader: ExtractTextPlugin.extract('css!postcss!less')
    },
    {
      test: function (filePath) {
        return (/\.less$/.test(filePath) && !/\.global\.less$/.test(filePath) && !/antd\/.*\.less$/.test(filePath));
      },
      loader: ExtractTextPlugin.extract('css?modules&localIdentName=[local]___[hash:base64:5]!postcss!less')
    },
    {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css')
    },
    {
      test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=image/png'
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff'
    },
    {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff'
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/octet-stream'
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/octet-stream'
    },
    {
      test: /font\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=image/svg+xml'
    }]
  },
  postcss: function () {
    return [autoprefixer];
  },
  plugins: [
    extractCss,
    defineProperty
  ]
};
