import * as API from '@webapp/service/api'

import { useRequest } from '../../../../../../../../hooks/useRequest'

export const useItems = ({ categoryUuid, categoryLevelIndex, draft, edit, parentCategoryItemUuid, surveyId }) => {
  const { items } = useRequest({
    condition: !edit && categoryUuid && (parentCategoryItemUuid || categoryLevelIndex === 0),
    defaultValue: { items: [] },
    dependencies: [edit, categoryUuid, categoryLevelIndex, parentCategoryItemUuid],
    requestFunction: API.fetchCategoryItems,
    requestArguments: [{ surveyId, categoryUuid, draft, parentUuid: parentCategoryItemUuid }],
  })
  return items
}
