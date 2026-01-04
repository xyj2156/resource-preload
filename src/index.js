import {resourceLoader} from './scheduler.js';

export {resourceLoader} from './scheduler.js'; // 核心预加载方法
export {registerLoader} from './loader.js'; // 注册自定义加载器
export {setGlobalConfig} from './config.js';  // 配置公共配置

// 默认导出核心预加载方法
export default resourceLoader;