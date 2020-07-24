import { matchPath, useLocation } from 'react-router'
import { designerModules, appModuleUri } from '@webapp/app/appModules'

export const useIsInPath = (paths) => {
  const { pathname } = useLocation()
  return (paths.constructor === Array ? paths : [paths]).some((path) => Boolean(matchPath(pathname, path)))
}

export const useInCategoriesPath = () =>
  useIsInPath([`${appModuleUri(designerModules.category)}:uuid/`, appModuleUri(designerModules.categories)])

export const useInTaxonomiesPath = () =>
  useIsInPath([`${appModuleUri(designerModules.taxonomy)}:uuid/`, appModuleUri(designerModules.taxonomies)])
