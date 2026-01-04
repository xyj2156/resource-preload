## 资源加载器

> 为了在vue项目中，预加载某些资源，开发此加载器
>
> 在需要动态使用字体图标时，需要加载某全部的字体图标库。
> 
> 加载时，想要先从CDN加载，如果失败，才从本地加载。


```js
/** 加载器说明 **/
// 预制了 css js 加载器

/** 加载配置说明 **/
const config = [
    // 必须有后缀，后缀和加载器名字一样
    'url',
    // url1 和 上面URL限制一样
    ['url1', 'url2'],
    // 加载a,类型为js的url,依次加载url1,url2,直到成功,默认超时时间1.5s
    {name:'a', type:'js', urls:['url1', 'url2']},
    // 加载b,类型为js的url,加载前先加载下面的配置c
    {name:'b', type:'js', urls:['url1', 'url2'], dependencies:['c']},
    {name:'c', type:'js', urls:['url1', 'url2']},
];
```

```js
/** ESM **/
// 导入加载方法
import {resourcePreloader} from 'reource-preloader';
import resourcePreloader from 'reource-preloader';
// 导入配置设置
import {registerLoader} from 'reource-preloader';
import {setGlobalConfig} from 'reource-preloader';
```

> 为了和ESM感觉用起来一样，AMD、Commonjs、UMD 等默认导出的是加载方法
```js
/** AMD/UMD(直接在浏览器中使用时，请引入requirejs) **/
require(['resource-preloader'], function (resourcePreloader) {
    // 加载器
    resourcePreloader([]);
    // 配置
    resourcePreloader.setGlobalConfig({timeout: 1500, retry: 0});
    resourcePreloader.registerLoader('name', function () {
        return Promise.reject('数据');
    });
});
```
```js
/** CJS/UMD(直接在浏览器中使用时，需要使用 browserify 打包) **/
const resourcePreloader = require('resource-preloader');
// 加载器
resourcePreloader([]);
// 配置
resourcePreloader.setGlobalConfig({timeout: 1500, retry: 0});
resourcePreloader.registerLoader('name', function () {
    return Promise.reject('数据');
});

```