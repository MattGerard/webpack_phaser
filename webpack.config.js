const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');

//Build Phaser custom modules into global space
const phaserModule = path.join(__dirname, 'node_modules/phaser-ce');
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js');
const pixi = path.join(phaserModule, 'build/custom/pixi.js');
const p2 = path.join(phaserModule, 'build/custom/p2.js');

module.exports = function(env) {
  const isProduction = env.production === true;

  const entry = isProduction
    ? {
        app: './src/index.js',
        vendor: ['pixi', 'p2', 'phaser'],
      }
    : {
        app: [
          './src/index.js',
          'webpack/hot/dev-server',
          'webpack-dev-server/client?http://localhost:8080',
        ],
        vendor: ['pixi', 'p2', 'phaser'],
      };

  const extractCSS = new ExtractTextPlugin({
    filename: './css/style-[contenthash:10].css',
    disable: !isProduction,
  });

  const phaserVendorFiles = new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: 'vendor.bundle.js',
  });

  const plugins = isProduction
    ? [
        new webpack.optimize.UglifyJsPlugin(),
        new HTMLWebpackPlugin({
          template: 'index-template.html',
        }),
        extractCSS,
        phaserVendorFiles,
      ]
    : [new webpack.HotModuleReplacementPlugin(), extractCSS, phaserVendorFiles];

  return {
    devtool: 'source-map',
    entry: entry,
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: ['babel-loader?compact=false'],
          exclude: '/node_modules/',
        },
        {
          test: /\.(png|jpg|gif)$/,
          loaders: ['url-loader?limit=10000&name=img/[hash:12].[ext]'],
          exclude: '/node_modules/',
        },
        {
          test: /pixi\.js/,
          loaders: ['expose-loader?PIXI'],
        },
        {
          test: /phaser-split\.js/,
          loaders: ['expose-loader?Phaser'],
        },
        {
          test: /p2\.js/,
          loaders: ['expose-loader?p2'],
        },
        {
          test: /\.css$/,
          use: extractCSS.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  plugins: function() {
                    return [
                      require('precss'),
                      require('postcss-cssnext')({
                        browsers: ['last 2 versions', '> 5%'],
                      }),
                    ];
                  },
                },
              },
            ],
            // use style-loader in development
            fallback: 'style-loader',
          }),
          exclude: '/node_modules/',
        },
      ],
    },
    output: {
      path: path.join(__dirname, './dist/'),
      publicPath: isProduction ? '/' : '/dist/',
      filename: isProduction ? 'bundle.[hash:12].min.js' : 'bundle.js',
      chunkFilename: 'bundle-[name]-[chunkhash].js',
    },
    resolve: {
      alias: {
        phaser: phaser,
        pixi: pixi,
        p2: p2,
      },
    },
  };
};
