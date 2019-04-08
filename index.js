const chalk = require('chalk');
const { done, logWithSpinner, stopSpinner, clearConsole } = require('@vue/cli-shared-utils');

const { printStats, cleanOutputDir } = require('./utils');
const bundle = require('./bundle');

module.exports = (api, options) => {
    const serviceCommandName = api.service.pkg.scripts['build-rollup'] ? 'build-rollup' : 'build';

    api.registerCommand(
        `${serviceCommandName}`,
        {
            description: 'build for production with rollup',
            usage: `vue-cli-service ${serviceCommandName} [options] [entry]`,
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

// Specify that both CLI commands will run in --mode production
// https://cli.vuejs.org/dev-guide/plugin-dev.html#specifying-mode-for-commands
module.exports.defaultModes = {
    'build': 'production',
    'build-rollup': 'production',
};
