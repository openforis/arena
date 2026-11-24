import fs from 'node:fs'
import path from 'node:path'

import { globSync } from 'glob'
import type { Configuration, ModuleOptions, ResolveOptions } from 'webpack'
import nodeExternals from 'webpack-node-externals'

type TestType = 'unit' | 'integration'

const dirname = import.meta.dirname

const isEsmOnlyModule = (moduleName: string): boolean => {
  const [first, second] = moduleName.split('/')
  const packageName = first.startsWith('@') ? `${first}/${second}` : first
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(dirname, '..', 'node_modules', packageName, 'package.json'), 'utf8')
    )
    return packageJson.type === 'module'
  } catch {
    return false
  }
}

const getEntry = (type: TestType): string[] =>
  // glob v13 requires forward slashes; path.resolve uses backslashes on Windows.
  globSync(path.resolve(dirname, type, 'tests', '*.{js,jsx,ts,tsx}').replaceAll('\\', '/')).sort((fileA, fileB) => {
    const idxA = path.basename(fileA).slice(0, 3)
    const idxB = path.basename(fileB).slice(0, 3)
    if (idxA < idxB) return -1
    if (idxA > idxB) return 1
    return 0
  })

const getOutput = (type: TestType): Configuration['output'] => ({
  path: path.resolve(dirname, '..', 'dist', '__tests__'),
  filename: `bundle.${type}.js`,
  publicPath: '/',
})

const getModule = (): ModuleOptions => ({
  rules: [
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /(node_modules|bower_components)/,
      use: [{ loader: 'babel-loader', options: { cacheDirectory: true } }],
    },
    // styles are never evaluated in Node: the lazy app wiring of the AI model resolver (dynamic import, which
    // webpack bundles) reaches the redux store and, through it, components that import stylesheets
    { test: /\.(scss|sass|css)$/, type: 'asset/source' },
  ],
})

const getResolve = (): ResolveOptions => ({
  extensions: [
    '.webpack-loader.js',
    '.web-loader.js',
    '.loader.js',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.scss',
    '.sass',
    '.css',
  ],
  alias: {
    '@common': path.resolve(dirname, '..', 'common/'),
    '@core': path.resolve(dirname, '..', 'core/'),
    '@server': path.resolve(dirname, '..', 'server/'),
    '@webapp': path.resolve(dirname, '..', 'webapp/'),
    '@test': path.resolve(dirname, '..', 'test/'),
  },
})

export const createWebpackConfig = (type: TestType): Configuration => ({
  entry: getEntry(type),
  target: 'node', // Ignore built-in modules like path, fs, etc.
  // Ignore all modules in node_modules folder, except the ESM-only ones: Jest can only require() ESM
  // natively on Node >= 24.9, so they are bundled (and transpiled) into the test bundle instead.
  // @turf/* is bundled too: @turf/length needs its nested @turf/distance 7.x, but the hoisted one is 6.x
  externals: [nodeExternals({ allowlist: [isEsmOnlyModule, /^@turf\//] })],
  mode: 'development',
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(dirname, '..', 'node_modules', '.cache', 'webpack-test', type),
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  output: getOutput(type),
  resolve: getResolve(),
  module: getModule(),
})
