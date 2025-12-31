import { preloadResources } from './scheduler.js';
import { registerLoader } from './loader.js';
import { setGlobalConfig } from './config.js';

// 导出核心API
export {
    preloadResources, // 核心预加载方法
    registerLoader,   // 注册自定义加载器
    setGlobalConfig,  // 配置公共配置
};

// 默认导出核心预加载方法
export default preloadResources;