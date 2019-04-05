const chalk = require('chalk');
const { log, done, logWithSpinner, stopSpinner, clearConsole } = require('@vue/cli-shared-utils');

const { printStats, cleanOutputDir } = require('./utils');
const bundle = require('./bundle');

module.exports = (api, options) => {
    api.registerCommand(
        'build',
        {
            description: 'build for production with rollup',
            usage: 'vue-cli-service build [options] [entry]',
            options: {
                '--dest': `specify output directory (default: ${options.outputDir})`,
                '--name': `name for lib or web-component mode (default: "name" in package.json or entry filename)`,
                '--no-clean': `do not remove the dist directory before building the project (default: true)`,
                '--globals': `specify id: variableName pairs necessary for external imports in umd bundle`,
                '--external': `specify module IDs that should remain external to the bundle`,
            },
        },
        async args => {
            cleanOutputDir(api, options, args);

            logWithSpinner(`\nBuilding for production as library (commonjs,esm,umd,umd-min)...`);

            const start = Date.now();

            await bundle(api, options, args);

            stopSpinner();
            clearConsole();

            done(chalk.green(`Compiled successfully in ${Date.now() - start}ms`));
            printStats(api, options, args);
        }
    );
};

module.exports.defaultModes = {
    build: 'production',
};
