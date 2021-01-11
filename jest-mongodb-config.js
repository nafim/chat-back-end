module.exports = {
    mongodbMemoryServerOptions: {
    instance: {
        dbName: 'jest'
    },
    binary: {
        version: '4.4.3', // Version of MongoDB
        skipMD5: true
    },
    autoStart: false
    }
};