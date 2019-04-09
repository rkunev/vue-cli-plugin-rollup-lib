const { rollup } = require('rollup');
const vue = require('rollup-plugin-vue');
const cjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const postcss = require('rollup-plugin-postcss');
const { terser } = require('rollup-plugin-terser');
const typescript = require('rollup-plugin-typescript2');
const img = require('rollup-plugin-img');

const chalk = require('chalk');
const { log } = require('@vue/cli-shared-utils');

const { parseName, getOutputDir, getTSConfig, buildExternalModules } = require('./utils');

const build = async (api, options, args, { format, minify }) => {
    const outputDir = getOutputDir(options, args);

    const tsConfig = getTSConfig(api);

    const { globals, external } = buildExternalModules(args.external);

    // use the provided name, otherwise use `name` from package.json
    const [baseName, umdGlobalName] = parseName(api.service.pkg.name, args.name);

    const entry = args.entry || args._[0] || 'src/App.vue';

    const sourceMaps = options.productionSourceMap && !!minify;

    const inputOptions = {
        input: api.resolve(entry),
        external,
        plugins: [
            cjs(),
            nodeResolve(),
            postcss({
                extract: api.resolve(`${outputDir}/${baseName}${minify ? '.min' : ''}.css`),
                inject: false,
                minimize: !!minify,
                sourceMap: sourceMaps,
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
            img({
                limit: -1,
                output: api.resolve(outputDir),
            }),
            !!minify && terser(),
        ],
    };

    const bundle = await rollup(inputOptions);

    return bundle.write({
        format,
        globals,
        file: api.resolve(`${outputDir}/${baseName}.${format}${minify ? '.min' : ''}.js`),
        name: umdGlobalName,
        sourcemap: sourceMaps,
    });
};

const bundle = async (api, options, args) => {
    const entries = [
        { format: 'umd' },
        { format: 'umd', minify: true },
        { format: 'cjs' },
        { format: 'esm' },
    ];

    return Promise.all(entries.map(e => build(api, options, args, e)));
};

module.exports = bundle;
