/**
 * 预检测所有资源的循环依赖
 * @param {Array<FullResourceConfig>} configList - 完整配置数组
 */
export default function (configList) {
  // 预构建配置映射，O(n) 时间复杂度
  const configMap = new Map(configList.map((config) => [config.name, config]));

  const visited = new Set();
  const visiting = new Set(); // 全局共享 visiting 集合

  for (const config of configList) {
    if (!visited.has(config.name)) {
      detectCycle(configMap, config.name);
    }
  }
  /**
   * 检测循环依赖
   * @param {Map} configMap - 预构建的配置映射
   * @param {string|number} currentId - 当前资源ID
   */
  function detectCycle(configMap, currentId) {
    const currentConfig = configMap.get(currentId);
    if (!currentConfig) {
      throw new Error(`未找到ID为${currentId}的资源配置`);
    }

    // 若正在访问中，说明存在循环依赖
    if (visiting.has(currentId)) {
      throw new Error(
        `检测到循环依赖：${Array.from(visiting).join(" -> ")} -> ${currentId}`,
      );
    }

    // 若已访问过，直接返回
    if (visited.has(currentId)) {
      return;
    }

    // 标记为正在访问
    visiting.add(currentId);

    // 递归检测依赖项
    const dependencies = currentConfig.dependencies || [];
    for (const depId of dependencies) {
      detectCycle(configMap, depId);
    }

    // 标记为已访问
    visiting.delete(currentId);
    visited.add(currentId);
  }
}
