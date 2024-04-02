import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { useMemo } from 'react'

export const useRandomColorsPerKeys = ({ keys, selectedKeys, onlyDarkColors = false, onlyLightColors = false }) => {
  const colorsArray = useRandomColors(keys.length, { onlyDarkColors, onlyLightColors })
  const allColorsByKey = useMemo(
    () => keys.reduce((acc, key, index) => ({ ...acc, [key]: colorsArray[index] }), {}),
    [colorsArray, keys]
  )
  return useMemo(() => selectedKeys.map((key) => allColorsByKey[key]), [allColorsByKey, selectedKeys])
}
