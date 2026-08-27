// eslint-disable-next-line import/no-extraneous-dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin');

class AddVersionPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('AddVersionPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        'AddVersionPlugin',
        (data, cb) => {
          const versionedScript = `${this.options.scriptPath}?v=${this.options.version}`;
          data.assets.js = [versionedScript, ...data.assets.js];
          cb(null, data);
        },
      );
    });
  }
}

module.exports = AddVersionPlugin;
