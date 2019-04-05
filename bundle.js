const { rollup } = require('rollup');
const vue = require('rollup-plugin-vue');
const cjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const postcss = require('rollup-plugin-postcss');
const { terser } = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');

const chalk = require('chalk');
const { log } = require('@vue/cli-shared-utils');

const { parseName, getOutputDir, getTSConfig, buildGlobalsHash, buildExternalList } = require('./utils');

const build = async ({
    input,
    output,
    format,
    minify,
    umdGlobalName,
    globals,
    external,
    productionSourceMap,
    cssFilePath = false,
    tsConfig = null,
}) => {
    const inputOptions = {
        input,
        external,
        plugins: [
            cjs(),
            nodeResolve(),
            postcss({
                extract: cssFilePath,
                inject: false,
                minimize: !!minify,
                sourceMap: productionSourceMap && !!minify,
            }),
            !!tsConfig && typescript(tsConfig),
            vue({
                css: false,
                style: {
                    postcssCleanOptions: {
                        disabled: !minify,
                    },
                },
                template: { optimizeSSR: format === 'cjs' },
            }),
            babel({
                exclude: ['node_modules/**'],
                babelrc: false,
                presets: [['@vue/babel-preset-app', { useBuiltIns: false }]],
            }),
            !!minify && terser(),
        ],
    };

    const bundle = await rollup(inputOptions);

    return bundle.write({
        format,
        globals,
        file: output,
        name: umdGlobalName,
        sourcemap: productionSourceMap && !!minify,
    });
};

const createBundle = async (api, options, args) => {
    const outputDir = getOutputDir(options, args);

    const tsConfig = getTSConfig(api);

    const globals = buildGlobalsHash(args.globals);
    const external = buildExternalList(args.external);

    // use the provided name, otherwise use `name` from package.json
    const [baseName, umdGlobalName] = parseName(api.service.pkg.name, args.name);

    const entry = args.entry || args._[0] || 'src/App.vue';
    const input = api.resolve(entry);

    const entries = [
        {
            input,
            external,
            umdGlobalName,
            globals,
            tsConfig,
            productionSourceMap: options.productionSourceMap,
            format: 'umd',
            output: api.resolve(`${outputDir}/${baseName}.umd.js`),
            cssFilePath: api.resolve(`${outputDir}/${baseName}.css`),
        },
        {
            input,
            external,
            umdGlobalName,
            globals,
            tsConfig,
            productionSourceMap: options.productionSourceMap,
            format: 'umd',
            minify: true,
            output: api.resolve(`${outputDir}/${baseName}.umd.min.js`),
            cssFilePath: api.resolve(`${outputDir}/${baseName}.min.css`),
        },
        {
            input,
            external,
            tsConfig,
            productionSourceMap: options.productionSourceMap,
            format: 'esm',
            output: api.resolve(`${outputDir}/${baseName}.esm.js`),
        },
        {
            input,
            external,
            tsConfig,
            productionSourceMap: options.productionSourceMap,
            format: 'cjs',
            output: api.resolve(`${outputDir}/${baseName}.common.js`),
        },
    ];

    return Promise.all(entries.map(build));
};

module.exports = createBundle;
