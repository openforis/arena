import { matchPath, useLocation } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

export const useIsInRoute = (path) => {
  const { pathname: currentPathName } = useLocation()
  // path can be a string or an array
  const paths = Array.isArray(path) ? path : [path]
  return paths.some((_path) => Boolean(matchPath(_path, currentPathName)))
}

/**
 * Uses the window location pathname value to always get the current location path
 * (it can be useful in component unmount callbacks where the location coming from useLocation
 * could give an old value of the location itself in the unmount callback).
 *
 * @returns {Function} - Function to test if a path is in the current location.
 */
export const useLocationPathMatcher = () => (path) => Boolean(matchPath(path, window.location.pathname))

export const useIsCategoriesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.category)}:uuid/`, appModuleUri(designerModules.categories)])

export const useIsTaxonomiesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.taxonomy)}:uuid/`, appModuleUri(designerModules.taxonomies)])

export const useIsDesignerNodeDefRoute = () => useIsInRoute([`${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`])
