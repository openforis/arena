/**
 * The translator unit tests pass to code that takes a `t`: it shows the key (and the params as JSON), so a test does
 * not depend on the English texts. Use it instead of a local fake.
 */

/**
 * Fake `t`: the key, followed by the params as JSON when there are any.
 * @param {string} key - Translation key.
 * @param {object} [params] - Params of the text.
 * @returns {string} The key and the params, e.g. `common:x{"count":2}`.
 */
export const fakeT = (key: string, params?: object): string => `${key}${params ? JSON.stringify(params) : ''}`

/**
 * Fake i18n instance whose `t` is `fakeT`.
 * @type {{ language: string, t: Function, exists: Function }}
 */
export const fakeI18n = { language: 'en', t: fakeT, exists: () => true }
