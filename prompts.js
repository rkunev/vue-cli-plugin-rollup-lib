module.exports = [
    {
        name: 'buildCommandType',
        type: 'list',
        message: 'Set `build` script in `package.json`',
        choices: [
            {
                name: 'Use the default - `vue-cli-service build`',
                value: 'build',
            },
            {
                name: 'Register a new command - `vue-cli-service build-rollup`',
                value: 'build-rollup',
            },
        ],
        default: 0,
    },
    {
        name: 'addBundlePaths',
        type: 'confirm',
        message: 'Populate `main`, `module` and `unpkg` fields in `package.json`?',
        default: true,
    },
];
