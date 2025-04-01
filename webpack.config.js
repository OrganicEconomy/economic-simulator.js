const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/index.js',
	devtool: 'inline-source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'economic-simulator.js',
		library: "economicSimulator",
	},
}
