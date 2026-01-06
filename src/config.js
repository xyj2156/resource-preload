// 默认公共配置
const defaultConfig = {
  timeout: 1500, // 默认超时时间1s
  retry: 0, // 默认不重试
};

/** @var {GlobalConfig} */
let globalConfig = { ...defaultConfig };

/**
 * 配置公共配置的方法（导出）
 * @param {GlobalConfig} config - 需覆盖的公共配置
 * @returns {GlobalConfig} 合并后的最终全局配置
 */
export function setGlobalConfig(config) {
  if (typeof config !== "object" || config === null) {
    throw new Error("配置参数必须是一个非空对象");
  }
  globalConfig = { ...globalConfig, ...config };
  return { ...globalConfig };
}

/**
 * 获取当前全局配置
 * @returns {GlobalConfig} 全局配置
 */
export function getGlobalConfig() {
  return { ...globalConfig };
}
