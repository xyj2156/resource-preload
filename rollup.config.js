import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
    // ESM 格式 - 开发版
    {
        input: 'src/index.js',
        output: {
            file: 'dist/resource-preloader.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    // ESM 格式 - 生产版
    {
        input: 'src/index.js',
        output: {
            file: 'dist/resource-preloader.esm.min.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            resolve(),
            commonjs(),
            terser()
        ]
    },

    // CommonJS 格式 - 开发版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.cjs.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    // CommonJS 格式 - 生产版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.cjs.min.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs(),
            terser()
        ]
    },

    // UMD 格式 - 开发版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.umd.js',
            format: 'umd',
            name: 'resourcePreloader',
            globals: {},
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    // UMD 格式 - 生产版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.umd.min.js',
            format: 'umd',
            name: 'resourcePreloader',
            globals: {},
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs(),
            terser()
        ]
    },

    // AMD 格式 - 开发版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.amd.js',
            format: 'amd',
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    // AMD 格式 - 生产版
    {
        input: 'src/other.js',
        output: {
            file: 'dist/resource-preloader.amd.min.js',
            format: 'amd',
            sourcemap: true,
            exports: 'default'
        },
        plugins: [
            resolve(),
            commonjs(),
            terser()
        ]
    }
];
