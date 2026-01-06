const configs = {
    'check - cycle':   [
        {name: 'a', type: 'js', dependencies: ['b'], urls: ['/dist/a.js']},
        {name: 'b', type: 'js', dependencies: ['a'], urls: ['/dist/b.js']},
    ],
    'check - success': [
        '//unpkg.com/element-plus/dist/index.css',
        '//cdn.jsdelivr.net/npm/element-plus/dist/index.css'
    ],
    'check - error':   [
        '/dist/resource-preloader.amd.js',
        '/dist/resource-preloader.umd.js',
        ['http://baidu.com/baidu.js', 'http://baidu.com/error.js']
    ]
};

async function each(type, fn) {
    for (const name in configs) {
        await (async function () {
            console.group('开始测试：', name);
            return fn(configs[name]).then(...createCallback(type)).finally(function () {
                console.groupEnd();
            });
        }());
    }
}

function createCallback(type) {
    return [
        function () {
            console.log(`${type} success`, ...arguments);
        },
        function () {
            console.log(`${type} error`, ...arguments);
        }
    ]
}