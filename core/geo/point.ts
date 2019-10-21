export const newPoint = (srsId: number, x: number, y: number) => `SRID=${srsId};POINT(${x} ${y})`

export default {
  newPoint,
};
