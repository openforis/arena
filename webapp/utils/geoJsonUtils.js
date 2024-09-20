// algorithm taken from https://gist.github.com/seyuf/ab9c980776e4c2cb350a2d1e70976517

const area = (polygon) => {
  let s = 0.0
  const coordinates = polygon.coordinates[0]
  for (let i = 0; i < coordinates.length - 1; i++) {
    const coordinate = coordinates[i]
    const nextCoordinate = coordinates[i + 1]
    const [x, y] = coordinate
    const [nextX, nextY] = nextCoordinate
    s += x * nextY - nextX * y
  }
  return 0.5 * s
}

const centroid = (polygon) => {
  let centerX = 0
  let centerY = 0
  const coordinates = polygon.coordinates[0]
  for (let i = 0; i < coordinates.length - 1; i++) {
    const coordinate = coordinates[i]
    const nextCoordinate = coordinates[i + 1]
    const [x, y] = coordinate
    const [nextX, nextY] = nextCoordinate
    const adj = x * nextY - nextX * y
    centerY += (x + nextX) * adj
    centerX += (y + nextY) * adj
  }
  const a = area(polygon)
  centerX /= a * 6
  centerY /= a * 6
  return { x: centerX, y: centerY }
}

export const GeoJsonUtils = {
  area,
  centroid,
}
