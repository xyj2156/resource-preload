// 资源配置类型
export interface ResourceConfig {
  /** 资源名称/ID */
  name: string;
  /** 资源类型 (js, css, 等) */
  type: string;
  /** 资源URL数组，按优先级顺序 */
  urls: string[];
  /** 依赖的其他资源ID数组 */
  dependencies?: string[];
}

// 加载结果类型
export interface LoadResult {
  /** 资源URL */
  url: string;
  /** 是否加载成功 */
  success: boolean;
  /** 加载的数据 */
  data: any;
  /** 错误信息 */
  error: Error | null;
}

// 资源加载结果类型
export interface ResourceLoadResult {
  /** 资源ID */
  resourceId: string;
  /** 原始配置 */
  config: ResourceConfig;
  /** 加载结果 */
  loadResult: LoadResult;
  /** 加载状态 */
  status: 'success' | 'failed';
  /** 错误信息 */
  error: Error | null;
}

// 全局配置类型
export interface GlobalConfig {
  /** 超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retry: number;
}

// 加载器函数类型
export type LoaderHandler = (url: string) => Promise<any>;

// 核心API类型定义

/**
 * 预加载资源的核心方法
 * @param configList - 资源配置数组
 * @returns 加载结果数组的Promise
 */
export function preloadResources(configList: ResourceConfig[]): Promise<ResourceLoadResult[]>;

/**
 * 注册自定义加载器
 * @param type - 资源类型标识
 * @param handler - 加载处理函数
 */
export function registerLoader(type: string, handler: LoaderHandler): void;

/**
 * 设置全局配置
 * @param config - 配置对象
 * @returns 合并后的全局配置
 */
export function setGlobalConfig(config: Partial<GlobalConfig>): GlobalConfig;

export default preloadResources;
