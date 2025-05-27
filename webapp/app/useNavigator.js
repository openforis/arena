import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { appModuleUri, designerModules } from './appModules'

export const useNavigator = () => {
  const navigate = useNavigate()

  return useMemo(
    () => ({
      navigateBack: () => navigate(-1),
      navigateToCategoryDetails: ({ categoryUuid }) =>
        navigate(`${appModuleUri(designerModules.category)}${categoryUuid}`),
    }),
    [navigate]
  )
}
