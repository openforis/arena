import * as Query from './query'

// not `export * as ... from`: the Babel transform of Playwright (e2e tests) does not support it
export { Query }
