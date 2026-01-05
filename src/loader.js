// 加载器映射表（存储内置+自定义加载器）
const loaderMap = new Map();

/**
 * 通用资源加载Promise封装
 * @param {string} url - 资源地址
 * @param {string} type - 具体的资源加载处理函数
 * @param {number} timeout - 超时时间
 * @returns {Promise<LoadResult>} 加载结果Promise
 */
export function wrapLoadPromise(url, type, timeout) {
    return new Promise(function (resolve, reject) {
        // 获取加载器处理函数
        const handler = getLoader(type);
        // 超时处理
        const timeoutTimer = setTimeout(() => {
            reject(new Error(`Resource ${url} load timeout (${timeout}ms)`));
        }, timeout);

        // 执行具体加载逻辑
        handler(url)
            .then(function (result) {
                clearTimeout(timeoutTimer);
                resolve({
                    url,
                    success: true,
                    data: result,
                    error: null,
                });
            })
            .catch(function (error) {
                clearTimeout(timeoutTimer);
                reject({
                    url,
                    success: false,
                    data: null,
                    error,
                });
            });
    });
}

/** 初始化内置加载器 **/
// --------------- 内置JS加载器 ---------------
loaderMap.set(
    'js',
    /**
     * JS加载器
     * @param {string} url
     * @returns {Promise<HTMLScriptElement|void>}
     */
    function (url) {
        const script = document.createElement('script');
        return new Promise(function (resolve, reject) {
            script.type = 'text/javascript';
            script.src = url;
            script.async = false; // 保持加载顺序（不开启异步）
            script.dataset.flag = 'resource-preloader';

            script.addEventListener('load', function (e) {
                resolve(script);
            });
            script.addEventListener('error', function () {
                reject(new Error(`JS resource ${url} load failed`));
            });

            document.head.appendChild(script);
        }).finally(function () {
            // 加载完成后移除标签，避免污染DOM
            document.head.removeChild(script);
        });
    }
);
// --------------- 内置CSS加载器 ---------------
loaderMap.set(
    'css',
    /**
     * CSS加载器
     * @param {string} url
     * @returns {Promise<HTMLLinkElement>}
     */
    function (url) {
        return new Promise(function (resolve, reject) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.dataset.flag = 'resource-preloader';

            link.addEventListener('load', function () {
                resolve(link);
            });
            link.addEventListener('error', function () {
                reject(new Error(`CSS resource ${url} load failed`));
                document.head.removeChild(link);
            });
            document.head.appendChild(link);
        });
    }
);
// --------------- 内置IMG加载器 ---------------
loaderMap.set(
    'img',
    /**
     * 图片加载器
     * @param url
     * @returns {Promise<HTMLImageElement>}
     */
    function (url) {
        const img = new Image();
        img.dataset.flag = 'resource-preloader';
        return new Promise(function (resolve, reject) {
            img.addEventListener('load', function () {
                resolve(img);
            });
            img.addEventListener('error', function () {
                reject(new Error(`IMG resource ${url} load failed`));
            });
            // img 标签不需要添加到DOM树
            img.src = url;
        });
    }
);
// --------------- 内置JSON加载器 ---------------
loaderMap.set(
    'json',
    /**
     * JSON加载器
     * @param {string} url
     * @returns {Promise<Object|Array|null|undefined>}
     */
    function (url) {
        return fetch(url)
            .then(function (res) {
                if (!res.ok) {
                    throw new Error(`JSON resource ${url} load failed`);
                }
                return res.json();
            })
            .catch(function (error) {
                throw new Error(`JSON resource ${url} load failed: ${error.message}`);
            });
    }
);

/**
 * 注册自定义加载器的方法
 * @param {string} type - 资源类型（唯一标识）
 * @param {LoaderHandler} handler - 加载处理函数，接收url参数，返回Promise
 */
export function registerLoader(type, handler) {
    if (typeof type !== 'string' || type.trim() === '') {
        throw new Error('资源类型必须是非空字符串');
    }
    const _ = Object.prototype.toString.call(type).slice(8, -1);
    if (['Function', 'AsyncFunction'].includes(_)) {
        throw new Error('加载器必须是一个函数返回Promise对象或一个异步函数');
    }
    if (loaderMap.has(type)) {
        console.warn(`类型为${type}的加载器已存在，将被覆盖`);
    }
    loaderMap.set(type, handler);
}

/**
 * 获取对应类型的加载器
 * @param {string} type - 资源类型
 * @returns {Function} 加载器处理函数
 */
function getLoader(type) {
    if (!loaderMap.has(type)) {
        throw new Error(`未找到${type}类型的加载器，请先注册自定义加载器`);
    }
    return loaderMap.get(type);
}
