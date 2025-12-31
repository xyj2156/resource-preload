// 加载器映射表（存储内置+自定义加载器）
const loaderMap = new Map();

/**
 * 通用资源加载Promise封装
 * @param {string} url - 资源地址
 * @param {Function} loadHandler - 具体的资源加载处理函数
 * @param {number} timeout - 超时时间
 * @returns {Promise<Object>} 加载结果Promise
 */
function wrapLoadPromise(url, loadHandler, timeout) {
    return new Promise((resolve, reject) => {
        // 超时处理
        const timeoutTimer = setTimeout(() => {
            reject(new Error(`Resource ${url} load timeout (${timeout}ms)`));
        }, timeout);

        // 执行具体加载逻辑
        loadHandler(url)
            .then((result) => {
                clearTimeout(timeoutTimer);
                resolve({
                    url,
                    success: true,
                    data: result,
                    error: null,
                });
            })
            .catch((error) => {
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

// --------------- 内置JS加载器 ---------------
function jsLoaderHandler(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false; // 保持加载顺序（不开启异步）

        script.onload = () => {
            resolve(script);
            document.head.removeChild(script); // 可选：加载完成后移除标签，避免污染DOM
        };

        script.onerror = () => {
            reject(new Error(`JS resource ${url} load failed`));
            document.head.removeChild(script);
        };

        document.head.appendChild(script);
    });
}

// --------------- 内置CSS加载器 ---------------
function cssLoaderHandler(url) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = () => {
            resolve(link);
        };

        link.onerror = () => {
            reject(new Error(`CSS resource ${url} load failed`));
        };

        document.head.appendChild(link);
    });
}

// 初始化内置加载器
loaderMap.set('js', jsLoaderHandler);
loaderMap.set('css', cssLoaderHandler);

/**
 * 注册自定义加载器的方法（导出）
 * @param {string} type - 资源类型（唯一标识）
 * @param {Function} handler - 加载处理函数，接收url参数，返回Promise
 */
function registerLoader(type, handler) {
    if (typeof type !== 'string' || type.trim() === '') {
        throw new Error('资源类型必须是非空字符串');
    }
    if (typeof handler !== 'function' || handler.constructor.name !== 'Function') {
        throw new Error('加载器必须是一个函数，且返回Promise对象');
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

export { registerLoader, getLoader, wrapLoadPromise }; // 导出wrapLoadPromise，避免冗余