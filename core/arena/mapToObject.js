// ====== UTILS
export const mapToObject = (map) => {
  const obj = {}
  map.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}
