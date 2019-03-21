module.exports = api => {
    api.extendPackage({
        scripts: {
            build: 'vue-cli-service build',
        }
    });
}
