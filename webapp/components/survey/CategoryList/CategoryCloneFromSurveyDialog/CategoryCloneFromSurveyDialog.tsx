import './CategoryCloneFromSurveyDialog.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import * as API from '@webapp/service/api'
import { useNotifyError } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

type DuplicateCheckResult = {
  key: string
  params: { name: string }
} | null

type CategoryCloneFromSurveyDialogProps = {
  onClose: () => void
  onConfirm: (params: { sourceSurveyId: number; sourceCategoryUuid: string }) => void
}

const surveyInfoToLabel = (surveyInfo: object): string => {
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getDefaultLabel(surveyInfo)
  return surveyLabel ? `${surveyLabel} [${surveyName}]` : surveyName
}

const compareSurveysByLabelOrName = (surveyA: object, surveyB: object): number => {
  const nameA = Survey.getName(surveyA)
  const nameB = Survey.getName(surveyB)
  const labelOrNameA = Survey.getDefaultLabel(surveyA) ?? nameA
  const labelOrNameB = Survey.getDefaultLabel(surveyB) ?? nameB
  const labelOrNameCompare = labelOrNameA.localeCompare(labelOrNameB)
  return labelOrNameCompare !== 0 ? labelOrNameCompare : nameA.localeCompare(nameB)
}

export const CategoryCloneFromSurveyDialog = (props: CategoryCloneFromSurveyDialogProps): React.ReactElement => {
  const { onClose, onConfirm } = props

  const i18n = useI18n()
  const currentSurveyId = useSurveyId()
  const notifyError = useNotifyError()

  const [surveys, setSurveys] = useState<object[]>([])
  const [surveysLoading, setSurveysLoading] = useState(true)
  const [sourceSurvey, setSourceSurvey] = useState<object | null>(null)

  const [categoriesBySurveyId, setCategoriesBySurveyId] = useState<Record<string, object[]>>({})
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [sourceCategory, setSourceCategory] = useState<object | null>(null)

  const [currentSurveyCategories, setCurrentSurveyCategories] = useState<object[]>([])

  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    Promise.all([API.fetchSurveys({ draft: false }), API.fetchSurveys({ draft: true })])
      .then(([surveysPublished, surveysDraft]) => {
        const surveysById = [...surveysPublished, ...surveysDraft].reduce<Record<string, object>>((acc, surveyInfo) => {
          acc[Survey.getIdSurveyInfo(surveyInfo)] = surveyInfo
          return acc
        }, {})
        const surveysFiltered = Object.values(surveysById)
          .filter((surveyInfo) => Survey.getIdSurveyInfo(surveyInfo) !== currentSurveyId)
          .sort(compareSurveysByLabelOrName)

        setSurveys(surveysFiltered)
      })
      .catch(() => setSurveys([]))
      .finally(() => setSurveysLoading(false))
  }, [currentSurveyId])

  useEffect(() => {
    API.fetchCategories({ surveyId: currentSurveyId, draft: true })
      .then(setCurrentSurveyCategories)
      .catch(() => setCurrentSurveyCategories([]))
  }, [currentSurveyId])

  const sourceSurveyId = sourceSurvey ? Survey.getIdSurveyInfo(sourceSurvey) : null
  const categories = sourceSurveyId ? categoriesBySurveyId[sourceSurveyId] : null

  const onSourceSurveyChange = useCallback(
    (surveyInfo: object | null) => {
      setSourceSurvey(surveyInfo)
      setSourceCategory(null)

      const surveyId = surveyInfo ? Survey.getIdSurveyInfo(surveyInfo) : null
      if (!surveyId || categoriesBySurveyId[surveyId]) return

      setCategoriesLoading(true)
      API.fetchCategories({ surveyId, draft: true })
        .then((categoriesFetched: object[]) => {
          setCategoriesBySurveyId((statePrev) => ({ ...statePrev, [surveyId]: categoriesFetched }))
        })
        .catch(() => {
          setCategoriesBySurveyId((statePrev) => ({ ...statePrev, [surveyId]: [] }))
        })
        .finally(() => setCategoriesLoading(false))
    },
    [categoriesBySurveyId]
  )

  const duplicateCheck: DuplicateCheckResult = useMemo(() => {
    if (!sourceCategory) return null

    const sourceCategoryUuid = Category.getUuid(sourceCategory)
    const sourceCategoryName = Category.getName(sourceCategory)

    // category uuids are preserved when cloning: if this exact category has already been cloned
    // into the current survey before (even if renamed since), cloning it again is not allowed
    const categoryWithSameUuid = currentSurveyCategories.find(
      (category: object) => Category.getUuid(category) === sourceCategoryUuid
    )
    if (categoryWithSameUuid) {
      return {
        key: 'validationErrors:categoryImport.uuidDuplicate',
        params: { name: Category.getName(categoryWithSameUuid) },
      }
    }

    const categoryWithSameName = currentSurveyCategories.find(
      (category: object) => Category.getName(category) === sourceCategoryName
    )
    if (categoryWithSameName) {
      return {
        key: 'validationErrors:categoryImport.nameDuplicate',
        params: { name: sourceCategoryName },
      }
    }

    return null
  }, [currentSurveyCategories, sourceCategory])

  const onConfirmClick = useCallback(async () => {
    if (duplicateCheck) {
      notifyError(duplicateCheck)
      return
    }
    setCloning(true)
    try {
      await onConfirm({
        sourceSurveyId: Survey.getIdSurveyInfo(sourceSurvey),
        sourceCategoryUuid: Category.getUuid(sourceCategory),
      })
    } catch (error: any) {
      const { key, params } = error?.response?.data ?? {}
      notifyError({ key: key ?? 'appErrors:generic', params })
    } finally {
      setCloning(false)
    }
  }, [duplicateCheck, notifyError, onConfirm, sourceCategory, sourceSurvey])

  const sourceSurveyDropdownPlaceholder = useMemo(() => {
    if (surveysLoading) return i18n.t('categoryList.cloneFromAnotherSurvey.loadingSurveys')
    if (surveys.length === 0) return i18n.t('categoryList.cloneFromAnotherSurvey.noSurveysAvailable')
    return i18n.t('common.selectOne')
  }, [surveysLoading, surveys, i18n])

  const categoryDropdownPlaceholder = useMemo(() => {
    if (!sourceSurvey) return i18n.t('categoryList.cloneFromAnotherSurvey.selectSurveyFirst')
    if (categoriesLoading) return i18n.t('categoryList.cloneFromAnotherSurvey.loadingCategories')
    if (categories?.length === 0) return i18n.t('categoryList.cloneFromAnotherSurvey.noCategoriesAvailable')
    return undefined
  }, [categories, categoriesLoading, i18n, sourceSurvey])

  const confirmButtonDisabled = !sourceSurvey || !sourceCategory || cloning || !!duplicateCheck

  return (
    <Modal
      className="category-list__category-clone-from-survey-dialog"
      onClose={onClose}
      showCloseButton
      title="categoryList.cloneFromAnotherSurvey.title"
    >
      <ModalBody>
        <FormItem label="categoryList.cloneFromAnotherSurvey.sourceSurvey">
          <Dropdown
            items={surveys}
            itemLabel={surveyInfoToLabel}
            itemValue={(surveyInfo: object) => Survey.getIdSurveyInfo(surveyInfo)}
            loading={surveysLoading}
            onChange={onSourceSurveyChange}
            placeholder={sourceSurveyDropdownPlaceholder}
            selection={sourceSurvey}
          />
        </FormItem>

        <FormItem label="categoryList.cloneFromAnotherSurvey.sourceCategory">
          <Dropdown
            disabled={!sourceSurvey}
            items={categories ?? []}
            itemLabel={(category: object) => Category.getName(category)}
            itemValue={(category: object) => Category.getUuid(category)}
            loading={categoriesLoading}
            onChange={setSourceCategory}
            placeholder={categoryDropdownPlaceholder}
            selection={sourceCategory}
          />
        </FormItem>

        {duplicateCheck && (
          <div className="clone-from-survey-dialog__message error">
            {i18n.t(duplicateCheck.key, duplicateCheck.params)}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button
          className="modal-footer__item"
          disabled={confirmButtonDisabled}
          label="common.confirm"
          onClick={onConfirmClick}
        />
      </ModalFooter>
    </Modal>
  )
}
