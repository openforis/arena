import { getViewportDimensions } from '@webapp/utils/domUtils'

const mobileScreenMaxWidth = 600

export const useIsMobile = () => {
  const { width: windowWidth } = getViewportDimensions()
  return windowWidth < mobileScreenMaxWidth
}
