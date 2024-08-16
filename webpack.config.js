const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

/**
 * @type {import("webpack").Configuration}
 */
module.exports = {
	mode: 'production',
	entry: {
		'index.js': path.resolve(__dirname, 'src/index.js'),
	},
	output: {
		filename: '[name]',
		path: path.resolve(__dirname, 'build'),
		libraryTarget: 'commonjs',
	},
	module: {
		rules: [
			// {
			// 	test: /\.js$/,
			// 	loader: 'babel-loader',
			// 	exclude: /node_modules/,
			// },
			{
				test: /\.(j|t)s$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
			} 
		],
	},
	stats: {
		colors: true,
	},
	externals: [
		"k6/metrics"
	],
	target: 'web',
	externals: /^(k6|https?\:\/\/)(\/.*)?/,
	devtool: 'source-map',
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
	plugins: [
		new CleanWebpackPlugin()
	]
};
