const resourceConfig = [
    '/dist/resource-preloader.amd.js',
    '/dist/resource-preloader.umd.js',
    ['http://baidu.com/baidu.js', 'http://baidu.com/error.js']
];


const createCallback = function (type) {
    return [
        function () {
            console.log(`${type} success`, ...arguments);
        },
        function () {
            console.log(`${type} error`, ...arguments);
        }
    ]
}