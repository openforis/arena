/* eslint-disable no-param-reassign */
export default (prop, value) => (obj) => {
  obj[prop] = value
  return obj
}
