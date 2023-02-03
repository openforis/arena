import { useCallback, useEffect, useRef, useState } from 'react'

const possibleColors = {
  aqua: '#00ffff',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  // black: '#000000',
  blue: '#0000ff',
  brown: '#a52a2a',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgrey: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkviolet: '#9400d3',
  fuchsia: '#ff00ff',
  gold: '#ffd700',
  green: '#008000',
  indigo: '#4b0082',
  khaki: '#f0e68c',
  lightblue: '#add8e6',
  lightcyan: '#e0ffff',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  magenta: '#ff00ff',
  maroon: '#800000',
  navy: '#000080',
  olive: '#808000',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  violet: '#800080',
  red: '#ff0000',
  silver: '#c0c0c0',
  white: '#ffffff',
  yellow: '#ffff00',
}

export const useRandomColor = (dependencies = []) => {
  const availableColorsRef = useRef([...Object.values(possibleColors)])

  const nextColor = useCallback(() => {
    const availableColors = availableColorsRef.current

    // pick a color randomly among the available (not used) ones
    const colorIndex = Math.floor(Math.random() * availableColors.length)
    const color = availableColors[colorIndex]

    // update state
    const availableColorsUpdated = [...availableColors]
    availableColorsUpdated.splice(colorIndex, 1)
    availableColorsRef.current =
      availableColorsUpdated.length > 0 ? availableColorsUpdated : [...Object.values(possibleColors)]

    return color
  }, dependencies)

  return {
    nextColor,
  }
}

export const useRandomColors = (size) => {
  const [colors, setColors] = useState([])

  useEffect(() => {
    const availableColors = [...Object.values(possibleColors)]

    const colorsUpdated = []

    for (let count = 0; count < size; count++) {
      // pick a color randomly among the available (not used) ones
      const colorIndex = Math.floor(Math.random() * availableColors.length)
      const color = availableColors[colorIndex]

      colorsUpdated.push(color)

      availableColors.splice(colorIndex, 1)
    }

    setColors(colorsUpdated)
  }, [size])

  return colors
}
