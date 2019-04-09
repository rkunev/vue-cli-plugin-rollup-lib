const chalk = require('chalk');
const { log, logWithSpinner, stopSpinner, clearConsole, done } = require('@vue/cli-shared-utils');

const { printStats, cleanOutputDir } = require('./utils');
const bundle = require('./bundle');

module.exports = (api, options) => {
    api.registerCommand(
        'build',
        {
            description: 'build for production with rollup',
            usage: `vue-cli-service build [options] [entry]`,
            options: {
                '--dest': `specify output directory (default: ${options.outputDir})`,
                '--name': 'name for lib or web-component mode (default: "name" in package.json or entry filename)',
                '--no-clean': 'do not remove the dist directory before building the project (default: true)',
                '--external': 'specify id: variableName pairs for imports that should remain external to the bundle',
            },
        },
        async args => {
            cleanOutputDir(api, options, args);

            log();
            logWithSpinner('Building for production as library (commonjs, esm, umd, umd-min)...');

            const start = Date.now();

            await bundle(api, options, args);

            stopSpinner();
            clearConsole();

            done(chalk.green(`Compiled successfully in ${Date.now() - start}ms`));
            printStats(api, options, args);
        }
    );
};

// Specify that the `build` CLI command will run in --mode production
// https://cli.vuejs.org/dev-guide/plugin-dev.html#specifying-mode-for-commands
module.exports.defaultModes = {
    'build': 'production'
};
