const { parseName } = require('./utils');

module.exports = (api, options) => {
    const pkg = require(api.resolve('package.json'));
    const [baseName, umdGlobalName] = parseName(pkg.name);

    api.extendPackage({
        scripts: {
            [options.buildCommandType]: `vue-cli-service ${options.buildCommandType}`,
        },
    });

    if (options.addBundlePaths) {
        api.extendPackage({
            main: `dist/${baseName}.common.js`,
            module: `dist/${baseName}.esm.js`,
            unpkg: `dist/${baseName}.umd.min.js`,
        });
    }
};
