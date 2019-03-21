const { rollup } = require('rollup');
const vue = require('rollup-plugin-vue');
const cjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const postcss = require('rollup-plugin-postcss');
const { terser } = require('rollup-plugin-terser');

// @todo
// * Unhardcode output path
// * Unhardcode input path
//     !! We can support this in v2
//     - How do we support multiple components?
//         - for example we could have `import button from 'mylib/button' where we have to ask the user to conform to specific file structure or to provide a list of components to bundle
// * Add support for SSR
//     * Add correct `browser` field in package.json
// * Add support for auto-installable plugin with Vue.use()
// * Add description to the build command


// remove pkg scope if any '@scope/foo' -> 'foo'
const stripPkgScope = name => name.replace(/\@(.*?)\//g, '');

// convert kebab-case to PascalCase 'foo-bar' -> 'FooBar'
const toPascalCase = name => name.replace(/(?:^|[-_\/])(\w)/g, (_, char) => char.toUpperCase());

module.exports = (api, options) => {
    api.registerCommand(
        'build',
        {
            description: 'Lorem ipsum dolor sit amet.',
            usage: 'vue-cli-service build',
        },
        async () => {
            const inputOptions = {
                input: api.resolve('src/components/HelloWorld.vue'),
                plugins: [
                    cjs(),
                    nodeResolve(),
                    postcss({
                        extract: true,
                        sourceMap: true,
                    }),
                    vue({ css: false }),
                    babel({
                        exclude: ['node_modules/**'],
                        babelrc: false,
                        presets: [['@vue/babel-preset-app', { useBuiltIns: false }]],
                    }),
                    // terser(/*{ preamble: banner }*/),
                ],
            };

            const bundle = await rollup(inputOptions);

            const outputName = stripPkgScope(api.service.pkg.name);
            const outputOptions = [
                {
                    file: api.resolve(`dist/${outputName}.umd.js`),
                    format: 'umd',
                    name: toPascalCase(outputName),
                },
                {
                    file: api.resolve(`dist/${outputName}.umd.min.js`),
                    format: 'umd',
                    name: toPascalCase(outputName),
                    sourcemap: true,
                },
                {
                    file: api.resolve(`dist/${outputName}.common.js`),
                    format: 'cjs',
                },
                {
                    file: api.resolve(`dist/${outputName}.esm.js`),
                    format: 'esm',
                },
            ];

            await Promise.all(outputOptions.map(o => bundle.write(o)));
        }
    );
};

module.exports.defaultModes = {
    build: 'production',
};
