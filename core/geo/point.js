export const newPoint = (srsId, x, y) => `SRID=${srsId};POINT(${x} ${y})`

export const parsePoint = point => {
  const [_, srsId, x, y] = /SRID=(\w+);POINT\((\d+) (\d+)\)/.exec(point)
  return { srsId, x, y }
}
