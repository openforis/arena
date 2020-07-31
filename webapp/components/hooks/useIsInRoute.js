import { matchPath, useLocation } from 'react-router'
import { designerModules, appModuleUri } from '@webapp/app/appModules'

export const useIsInRoute = (path) => {
  const { pathname } = useLocation()
  return Boolean(matchPath(pathname, path))
}

export const useIsCategoriesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.category)}:uuid/`, appModuleUri(designerModules.categories)])

export const useIsTaxonomiesRoute = () =>
  useIsInRoute([`${appModuleUri(designerModules.taxonomy)}:uuid/`, appModuleUri(designerModules.taxonomies)])

export const useIsDesignerNodeDefRoute = () => useIsInRoute([`${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`])
