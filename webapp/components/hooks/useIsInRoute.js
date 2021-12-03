import { matchPath, useLocation } from 'react-router'
import { designerModules, appModuleUri } from '@webapp/app/appModules'

export const useIsInRoute = (path) => {
  const { pathname: currentPathName } = useLocation()
  // path can be a string or an array
  if (typeof path === 'string') {
    return Boolean(matchPath(currentPathName, path))
  } else {
    path.every((_path) => Boolean(matchPath(currentPathName, _path)))
  }
}

export const useIsCategoriesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.category)}:uuid/`, appModuleUri(designerModules.categories)])

export const useIsTaxonomiesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.taxonomy)}:uuid/`, appModuleUri(designerModules.taxonomies)])

export const useIsDesignerNodeDefRoute = () => useIsInRoute([`${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`])
