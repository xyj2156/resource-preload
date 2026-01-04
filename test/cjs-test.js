(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

// 默认公共配置
const defaultConfig = {
    timeout: 1000, // 默认超时时间1s
    retry: 0, // 默认不重试
};

let globalConfig = { ...defaultConfig };

/**
 * 配置公共配置的方法（导出）
 * @param {Object} config - 需覆盖的公共配置
 * @returns {Object} 合并后的最终全局配置
 */
function setGlobalConfig(config) {
    if (typeof config !== 'object' || config === null) {
        throw new Error('配置参数必须是一个非空对象');
    }
    globalConfig = { ...globalConfig, ...config };
    return { ...globalConfig };
}

/**
 * 获取当前全局配置
 * @returns {Object} 全局配置
 */
function getGlobalConfig() {
    return { ...globalConfig };
}

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
 // 导出wrapLoadPromise，避免冗余

/**
 * 检测循环依赖（深度优先遍历，配置字段改为dependencies）
 * @param {Array} configList - 完整配置数组
 * @param {number} currentId - 当前资源ID
 * @param {Set} visited - 已访问的资源ID集合
 * @param {Set} visiting - 正在访问的资源ID集合（用于检测环）
 */
function detectCycle(configList, currentId, visited, visiting) {
    const currentConfig = configList.find(item => item.name === currentId);
    if (!currentConfig) {
        throw new Error(`未找到ID为${currentId}的资源配置`);
    }

    // 若正在访问中，说明存在循环依赖
    if (visiting.has(currentId)) {
        throw new Error(`检测到循环依赖：${Array.from(visiting).join(' -> ')} -> ${currentId}`);
    }

    // 若已访问过，直接返回（无需重复检测）
    if (visited.has(currentId)) {
        return;
    }

    // 标记为正在访问
    visiting.add(currentId);
    // 递归检测依赖项（改为dependencies）
    const dependencies = currentConfig.dependencies || [];
    for (const depId of dependencies) {
        detectCycle(configList, depId, visited, visiting);
    }
    // 标记为已访问，移出正在访问集合
    visiting.delete(currentId);
    visited.add(currentId);
}

/**
 * 预检测所有资源的循环依赖（配置字段改为dependencies）
 * @param {Array} configList - 完整配置数组
 */
function checkAllCycles(configList) {
    const visited = new Set();
    for (const config of configList) {
        detectCycle(configList, config.name, visited, new Set());
    }
}

/**
 * 递归加载单个资源及其所有依赖（保证依赖先加载，配置字段改为dependencies）
 * @param {string|number} resourceId - 资源ID
 * @param {Array} configList - 完整配置数组
 * @param {number} timeout - 超时时间
 * @param {Map} loadedMap - 已加载资源的结果缓存
 */
async function loadResourceWithDeps(resourceId, configList, timeout, loadedMap) {
    // 若已加载，直接返回缓存结果
    if (loadedMap.has(resourceId)) {
        return loadedMap.get(resourceId);
    }

    const currentConfig = configList.find(item => item.name === resourceId);
    if (!currentConfig) {
        throw new Error(`未找到ID为${resourceId}的资源配置`);
    }

    // 1. 先加载所有依赖（改为dependencies）
    const dependencies = currentConfig.dependencies || [];
    for (const depId of dependencies) {
        await loadResourceWithDeps(depId, configList, timeout, loadedMap);
    }

    // 2. 再加载当前资源的urls（顺序加载，一个成功即可）
    const {urls, type} = currentConfig;
    let loadResult = null;
    let status = 'success';
    let error = null;

    try {
        loadResult = await loadUrlsInOrder(urls, type, timeout);
    } catch (err) {
        status = 'failed';
        error = err;
    }

    // 3. 缓存加载结果
    const result = {
        resourceId,
        config: currentConfig,
        loadResult,
        status,
        error,
    };
    loadedMap.set(resourceId, result);
    return result;
}

/**
 * 按顺序加载urls，只需要一个成功即可
 * @param {Array} urls - 资源地址数组
 * @param {string} type - 资源类型
 * @param {number} timeout - 超时时间
 * @returns {Promise<Object>} 第一个成功的加载结果
 */
async function loadUrlsInOrder(urls, type, timeout) {
    if (!Array.isArray(urls) || urls.length === 0) {
        throw new Error('urls必须是非空数组');
    }

    const loader = getLoader(type);
    let lastError;

    // 按顺序遍历urls，直到有一个加载成功
    for (const url of urls) {
        try {
            return await wrapLoadPromise(url, loader, timeout);
        } catch (error) {
            lastError = error;
            continue; // 加载失败，继续下一个url
        }
    }

    // 所有url都加载失败，抛出最后一个错误
    throw new Error(`所有${type}类型资源加载失败，最后一个错误：${lastError?.message || '未知错误'}`);
}

/**
 * 核心加载调度方法（最终结果保持配置定义顺序）
 * @param {Array<ResourceConfig>} configList - 输入配置数组
 * @returns {Promise<ResourceLoadResult[]>} 按配置定义顺序的加载结果数组
 */
async function preloadResources(configList) {
    if (!Array.isArray(configList) || configList.length === 0) {
        throw new Error('配置数组必须是非空数组');
    }

    // 将 string[] 形式处理成 { name, urls, type } 形式
    configList = configList.map(item => {
        if (typeof item === 'string') {
            const url = new URL(item, window.location.href);
            return {
                name: url.pathname,
                urls: [item],
                type: url.pathname.split('.').pop() || 'js',
            };
        } else if (Array.isArray(item)) {
            if (!item.length) {
                return;
            }
            const url = new URL(item[0], window.location.href);
            return {
                name: url.pathname,
                urls: item,
                type: url.pathname.split('.').pop() || 'js',
            };
        } else {
            return item;
        }
    }).filter(Boolean);

    // 1. 获取全局配置
    const {timeout: globalTimeout} = getGlobalConfig();

    // 2. 预检测所有循环依赖（防止无限递归）
    checkAllCycles(configList);

    // 3. 初始化缓存（存储已加载资源结果，避免重复加载）
    const loadedMap = new Map();

    // 4. 按配置定义的顺序，并行加载同层级无依赖资源（保证依赖先加载，结果保留原始顺序）
    const rawOrderPromises = configList.map(async (config) => {
        return await loadResourceWithDeps(config.name, configList, globalTimeout, loadedMap);
    });

    // 5. 等待所有资源加载完成，返回原始配置顺序的结果
    return Promise.all(rawOrderPromises).then(function (result) {
        if (result.find(item => item.error)) {
            return Promise.reject(result);
        }
        return result;
    });
}

preloadResources.registerLoader = registerLoader;
preloadResources.setGlobalConfig = setGlobalConfig;

module.exports = preloadResources;


},{}],2:[function(require,module,exports){
const loader = require('../dist/resource-loader.cjs.js');

loader(resourceConfig).then(... createCallback('cjs'));


},{"../dist/resource-loader.cjs.js":1}]},{},[2]);
