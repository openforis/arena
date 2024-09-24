// algorithm taken from https://gist.github.com/seyuf/ab9c980776e4c2cb350a2d1e70976517

const area = (polygon) => {
  let result = 0.0
  const coordinates = polygon.coordinates[0]
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i]
    const nextCoordinate = coordinates[i < coordinates.length - 1 ? i + 1 : 0]
    const [x, y] = coordinate
    const [nextX, nextY] = nextCoordinate
    const xDiff = nextX - x
    const yDiff = nextY - y
    result += x * yDiff - y * xDiff
  }
  return 0.5 * result
}

const perimeter = (polygon) => {
  let result = 0.0
  const coordinates = polygon.coordinates[0]
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i]
    const nextCoordinate = coordinates[i < coordinates.length - 1 ? i + 1 : 0]
    const [x, y] = coordinate
    const [nextX, nextY] = nextCoordinate
    const xDiff = nextX - x
    const yDiff = nextY - y
    result = result + Math.pow(xDiff * xDiff + yDiff * yDiff, 0.5)
  }
  return result
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
    centerX += (x + nextX) * adj
    centerY += (y + nextY) * adj
  }
  const a = area(polygon)
  centerX /= a * 6
  centerY /= a * 6
  return { x: centerX, y: centerY }
}

const validateFeature = (geoJson) => geoJson?.type === 'Feature' && !!geoJson.geometry

const parse = (geoJsonText) => {
  let geoJson = null
  try {
    geoJson = JSON.parse(geoJsonText)
  } catch (_error) {
    // ignore it
  }
  return validateFeature(geoJson) ? geoJson : null
}

const countVertices = (polygon) => polygon?.coordinates?.[0]?.length ?? 0

export const GeoJsonUtils = {
  area,
  centroid,
  validateFeature,
  parse,
  countVertices,
  perimeter,
}
