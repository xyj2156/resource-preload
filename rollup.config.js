import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ESM 格式 - 开发版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.esm.js',
      format: 'es',
      sourcemap: !isProduction
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
      file: 'dist/resource-loader.esm.min.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  
  // CommonJS 格式 - 开发版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  
  // CommonJS 格式 - 生产版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.cjs.min.js',
      format: 'cjs',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  
  // UMD 格式 - 开发版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.umd.js',
      format: 'umd',
      name: 'ResourceLoader',
      globals: {},
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  
  // UMD 格式 - 生产版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.umd.min.js',
      format: 'umd',
      name: 'ResourceLoader',
      globals: {},
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  
  // AMD 格式 - 开发版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.amd.js',
      format: 'amd',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  
  // AMD 格式 - 生产版
  {
    input: 'src/index.js',
    output: {
      file: 'dist/resource-loader.amd.min.js',
      format: 'amd',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  }
];
