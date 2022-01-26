const toYiq = (hexColor) => {
  const r = parseInt(hexColor.substr(1, 2), 16)
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

const getHighContrastTextColor = (hexColor) => {
  const yiq = toYiq(hexColor)
  return yiq >= 128
    ? '#000000' // black
    : '#ffffff' // white
}

export const Colors = {
  getHighContrastTextColor,
}
