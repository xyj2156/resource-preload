import {getGlobalConfig} from './config.js';
import {getLoader, wrapLoadPromise} from './loader.js';

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
async function resourceLoader(configList) {
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

export {resourceLoader};