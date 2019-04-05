const fse = require('fs-extra');
const zlib = require('zlib');
const chalk = require('chalk');
const kebabCase = require('lodash.kebabcase');
const ui = require('cliui')({ width: 80 });
const { log } = require('@vue/cli-shared-utils');

// remove pkg scope if any '@scope/foo' -> 'foo'
const stripPkgScope = name => name.replace(/\@(.*?)\//g, '');

// convert kebab-case to PascalCase 'foo-bar' -> 'FooBar'
const kebabToPascalCase = name => name.replace(/(?:^|[-_\/])(\w)/g, (_, char) => char.toUpperCase());

const parseName = (pkgName, argsName) => {
    let baseName = '';
    let umdGlobalName = '';

    if (argsName) {
        baseName = kebabCase(argsName);
        umdGlobalName = argsName;
    } else {
        baseName = stripPkgScope(pkgName);
        umdGlobalName = kebabToPascalCase(baseName);
    }

    return [baseName, umdGlobalName];
};

const buildGlobalsHash = (globals = '') => {
    return globals.split(',').reduce(
        (prev, next) => {
            const [key, value] = next.split(':');

            if (key) {
                prev[key] = value;
            }

            return prev;
        },
        { vue: 'Vue' }
    );
};

const buildExternalList = external => ['vue'].concat(external ? external.split(',') : []);

const isMap = name => /\.map$/.test(name);
const isJS = name => /\.js$/.test(name);
const isCSS = name => /\.css$/.test(name);
const formatSize = size => (size / 1024).toFixed(2) + ' KiB';
const makeRow = (a, b, c) => `  ${a}\t    ${b}\t ${c}`;

const getOutputDir = (options, args) => args.dest || options.outputDir;

const cleanOutputDir = async (api, options, args) => {
    const outputDir = getOutputDir(options, args);

    // when --no-clean is passed the value of `clean` is false
    // when it's not - `clean` is undefined or null and by default we'll clean the dir
    if (args.clean == null) {
        await fse.remove(api.resolve(outputDir));
    }
};

const printStats = (api, options, args) => {
    const outputDir = getOutputDir(options, args);

    const assets = fse
        .readdirSync(api.resolve(outputDir))
        .filter(fileName => !isMap(fileName))
        .map(fileName => {
            const filePath = api.resolve(`${outputDir}/${fileName}`);

            const { size } = fse.statSync(filePath);
            const gzipped = zlib.gzipSync(fse.readFileSync(filePath)).length;

            return {
                name: `${outputDir}/${fileName}`,
                size: formatSize(size),
                gzipped: formatSize(gzipped),
            };
        })
        .sort((a, b) => {
            // move CSS files to be last
            if (isCSS(a.name) && isJS(b.name)) return 1;

            // otherwise sort alphabetically
            return a.name.localeCompare(b.name);
        });

    ui.div(
        makeRow(chalk.cyan.bold('File'), chalk.cyan.bold('Size'), chalk.cyan.bold('Gzipped')) +
            `\n\n` +
            assets
                .map(({ name, size, gzipped }) =>
                    makeRow(isJS(name) ? chalk.green(name) : chalk.blue(name), size, gzipped)
                )
                .join(`\n`)
    );

    log(`\n${ui.toString()}\n\n  ${chalk.gray(`Images and other types of assets omitted.`)}\n`);
};

const getTSConfig = api => {
    return api.hasPlugin('typescript')
        ? {
              typescript: require(api.resolve('./node_modules/typescript')),
              tsconfig: api.resolve('./tsconfig.json'),
              cacheRoot: api.resolve('./node_modules/.cache/.rts2_cache'),
              clean: true,
          }
        : null;
};

module.exports = {
    stripPkgScope,
    kebabToPascalCase,
    parseName,
    buildGlobalsHash,
    buildExternalList,
    getOutputDir,
    cleanOutputDir,
    printStats,
    getTSConfig,
};
