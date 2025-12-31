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

export { setGlobalConfig, getGlobalConfig };