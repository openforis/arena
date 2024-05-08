import { Strings } from '@openforis/arena-core'

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

const lightenColor = (hexColor, percent) => {
  const limitFrom0To255 = (value) => {
    if (value >= 255) return 255
    if (value < 1) return 0
    return value
  }

  const num = parseInt(Strings.removePrefix('#')(hexColor), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const B = ((num >> 8) & 0x00ff) + amt
  const G = (num & 0x0000ff) + amt

  return (
    '#' +
    (0x1000000 + limitFrom0To255(R) * 0x10000 + limitFrom0To255(B) * 0x100 + limitFrom0To255(G)).toString(16).slice(1)
  )
}

export const Colors = {
  getHighContrastTextColor,
  lightenColor,
}
