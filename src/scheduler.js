import { getGlobalConfig } from "./config.js";
import { wrapLoadPromise } from "./loader.js";
import checkDependencies from "./checker.js";

/**
 * 递归加载单个资源及其所有依赖（保证依赖先加载，配置字段改为dependencies）
 * @param {string|number} name - 资源ID
 * @param {Array} configList - 完整配置数组
 * @param {number} timeout - 超时时间
 * @param {Map} loadedMap - 已加载资源的结果缓存
 * @returns {Promise<ResourceLoadResult>} 加载结果
 */
async function loadResourceWithDeps(name, configList, timeout, loadedMap) {
  // 若已加载，直接返回缓存结果
  if (loadedMap.has(name)) {
    return loadedMap.get(name);
  }

  const currentConfig = configList.find((item) => item.name === name);
  if (!currentConfig) {
    throw new Error(`未找到name为${name}的资源配置`);
  }

  // 1. 先加载所有依赖（改为dependencies）
  const dependencies = currentConfig.dependencies || [];
  for (const _ of dependencies) {
    await loadResourceWithDeps(_, configList, timeout, loadedMap);
  }

  // 2. 再加载当前资源的urls（顺序加载，一个成功即可）
  const { urls, type } = currentConfig;
  let loadResult = null;
  let status = "success";
  let error = null;

  try {
    loadResult = await loadUrlsInOrder(name, urls, type, timeout);
  } catch (err) {
    status = "failed";
    error = err;
  }

  // 3. 缓存加载结果
  const result = {
    name,
    config: currentConfig,
    result: loadResult,
    status,
    error,
  };
  loadedMap.set(name, result);
  return result;
}

/**
 * 按顺序加载urls，只需要一个成功即可
 * @param {string} name - 资源名
 * @param {Array<string>} urls - 资源地址数组
 * @param {string} type - 资源类型
 * @param {number} timeout - 超时时间
 * @returns {Promise<LoadResult>} 成功的加载结果
 */
async function loadUrlsInOrder(name, urls, type, timeout) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("urls必须是非空数组");
  }

  let lastError;
  const errors = [];

  // 按顺序遍历urls，直到有一个加载成功
  for (const url of urls) {
    try {
      const ret = await wrapLoadPromise(url, type, timeout);
      if (errors.length) {
        console.warn(`加载${name}资源时的一些错误信息：`, errors);
      }
      return ret;
    } catch (error) {
      errors.push({ url, error });
      lastError = error; // 加载失败，继续下一个url
    }
  }

  // 所有url都加载失败，抛出最后一个错误
  console.warn(`所有${name}资源加载错误信息`, errors);
  throw new Error(`所有${name}资源加载失败，错误内容看上面`);
}

/**
 * 核心加载调度方法（最终结果保持配置定义顺序）
 * @param {Array<ResourceConfig>} configList - 输入配置数组
 * @returns {Promise<ResourceLoadResult[]>} 按配置定义顺序的加载结果数组
 */
export async function resourcePreloader(configList) {
  if (!Array.isArray(configList) || configList.length === 0) {
    throw new Error("配置数组必须是非空数组");
  }

  // 将 string[]|string 形式处理成 { name, urls, type } 形式 同时处理 urls:string 为 urls:[string]
  /** @type {Array<FullResourceConfig>} */
  const configs = configList
    .map(function(item) {
      if (typeof item === "string") {
        const url = new URL(item, window.location.href);
        return {
          name: url.pathname,
          urls: [item],
          type: url.pathname.split(".").pop() || "js",
        };
      } else if (Array.isArray(item)) {
        if (!item.length) {
          return;
        }
        const url = new URL(item[0], window.location.href);
        return {
          name: url.pathname,
          urls: item,
          type: url.pathname.split(".").pop() || "js",
        };
      } else {
        if (typeof item.urls === "string") {
          item.urls = [item.urls];
        }
        return item;
      }
    })
    .filter(Boolean);

  // 1. 获取全局配置
  const { timeout: globalTimeout } = getGlobalConfig();

  // 2. 预检测所有循环依赖（防止无限递归）
  checkDependencies(configs);

  // 3. 初始化缓存（存储已加载资源结果，避免重复加载）
  const loadedMap = new Map();

  // 4. 按配置定义的顺序，并行加载同层级无依赖资源（保证依赖先加载，结果保留原始顺序）
  const rawOrderPromises = configs.map(async function (config) {
    return await loadResourceWithDeps(
      config.name,
      configs,
      globalTimeout,
      loadedMap,
    );
  });

  // 5. 等待所有资源加载完成，返回原始配置顺序的结果
  return Promise.all(rawOrderPromises).then(function (result) {
    if (result.find((item) => item.error)) {
      return Promise.reject(result);
    }
    return result;
  });
}
