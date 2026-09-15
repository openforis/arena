import '../../cloneFromSurveyDialog.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Taxonomy as ArenaTaxonomy } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import * as API from '@webapp/service/api'
import { surveyInfoToLabel, useNotifyError, useOtherSurveysList } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import { getTaxonomyDuplicateCheck } from './taxonomyCloneDuplicateCheck'

type TaxonomyCloneFromSurveyDialogProps = {
  onClose: () => void
  onConfirm: (params: { sourceSurveyId: number; sourceTaxonomyUuid: string }) => Promise<void>
}

export const TaxonomyCloneFromSurveyDialog = (props: TaxonomyCloneFromSurveyDialogProps): React.ReactElement => {
  const { onClose, onConfirm } = props

  const i18n = useI18n()
  const currentSurveyId = useSurveyId()
  const notifyError = useNotifyError()

  const { surveys, surveysLoading } = useOtherSurveysList()
  const [sourceSurvey, setSourceSurvey] = useState<object | null>(null)

  const [taxonomiesBySurveyId, setTaxonomiesBySurveyId] = useState<Record<string, object[]>>({})
  const [loadingSurveyId, setLoadingSurveyId] = useState<string | number | null>(null)
  const [sourceTaxonomy, setSourceTaxonomy] = useState<ArenaTaxonomy | null>(null)

  const [currentSurveyTaxonomies, setCurrentSurveyTaxonomies] = useState<ArenaTaxonomy[]>([])

  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    API.fetchTaxonomies({ surveyId: currentSurveyId, draft: true })
      .then(setCurrentSurveyTaxonomies)
      .catch(() => setCurrentSurveyTaxonomies([]))
  }, [currentSurveyId])

  const sourceSurveyId = sourceSurvey ? Survey.getIdSurveyInfo(sourceSurvey) : null
  const taxonomies = sourceSurveyId ? taxonomiesBySurveyId[sourceSurveyId] : null
  const taxonomiesLoading = sourceSurveyId !== null && loadingSurveyId === sourceSurveyId

  const onSourceSurveyChange = useCallback(
    (surveyInfo: object | null) => {
      setSourceSurvey(surveyInfo)
      setSourceTaxonomy(null)

      const surveyId = surveyInfo ? Survey.getIdSurveyInfo(surveyInfo) : null
      if (!surveyId || taxonomiesBySurveyId[surveyId]) return

      setLoadingSurveyId(surveyId)
      API.fetchTaxonomies({ surveyId, draft: true })
        .then((taxonomiesFetched: object[]) => {
          setTaxonomiesBySurveyId((statePrev) => ({ ...statePrev, [surveyId]: taxonomiesFetched }))
        })
        .catch(() => {
          setTaxonomiesBySurveyId((statePrev) => ({ ...statePrev, [surveyId]: [] }))
        })
        .finally(() => setLoadingSurveyId((prev) => (prev === surveyId ? null : prev)))
    },
    [taxonomiesBySurveyId]
  )

  const duplicateCheck = useMemo(
    () => getTaxonomyDuplicateCheck({ currentSurveyTaxonomies, sourceTaxonomy }),
    [currentSurveyTaxonomies, sourceTaxonomy]
  )

  const onConfirmClick = useCallback(async () => {
    if (duplicateCheck) {
      notifyError(duplicateCheck)
      return
    }
    setCloning(true)
    try {
      await onConfirm({
        sourceSurveyId: Survey.getIdSurveyInfo(sourceSurvey),
        sourceTaxonomyUuid: Taxonomy.getUuid(sourceTaxonomy),
      })
    } catch (error: any) {
      const { key, params } = error?.response?.data ?? {}
      notifyError({ key: key ?? 'appErrors:generic', params })
    } finally {
      setCloning(false)
    }
  }, [duplicateCheck, notifyError, onConfirm, sourceTaxonomy, sourceSurvey])

  const sourceSurveyDropdownPlaceholder = useMemo(() => {
    if (surveysLoading) return i18n.t('taxonomy.cloneFromAnotherSurvey.loadingSurveys')
    if (surveys.length === 0) return i18n.t('taxonomy.cloneFromAnotherSurvey.noSurveysAvailable')
    return i18n.t('common.selectOne')
  }, [surveysLoading, surveys, i18n])

  const taxonomyDropdownPlaceholder = useMemo(() => {
    if (!sourceSurvey) return i18n.t('taxonomy.cloneFromAnotherSurvey.selectSurveyFirst')
    if (taxonomiesLoading) return i18n.t('taxonomy.cloneFromAnotherSurvey.loadingTaxonomies')
    if (taxonomies?.length === 0) return i18n.t('taxonomy.cloneFromAnotherSurvey.noTaxonomiesAvailable')
    return undefined
  }, [taxonomies, taxonomiesLoading, i18n, sourceSurvey])

  const confirmButtonDisabled = !sourceSurvey || !sourceTaxonomy || cloning || !!duplicateCheck

  return (
    <Modal
      className="taxonomy-list__taxonomy-clone-from-survey-dialog clone-from-survey-dialog"
      onClose={onClose}
      showCloseButton
      title="taxonomy.cloneFromAnotherSurvey.title"
    >
      <ModalBody>
        <FormItem label="taxonomy.cloneFromAnotherSurvey.sourceSurvey">
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

        <FormItem label="taxonomy.cloneFromAnotherSurvey.sourceTaxonomy">
          <Dropdown
            disabled={!sourceSurvey}
            items={taxonomies ?? []}
            itemLabel={(taxonomy: object) => Taxonomy.getName(taxonomy)}
            itemValue={(taxonomy: object) => Taxonomy.getUuid(taxonomy)}
            loading={taxonomiesLoading}
            onChange={setSourceTaxonomy}
            placeholder={taxonomyDropdownPlaceholder}
            selection={sourceTaxonomy}
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
