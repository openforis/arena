import './chainCloneFromSurveyDialog.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions } from '@webapp/store/ui/chain'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

type ChainItem = {
  value: string
  label: string
  chain: object
}

type SurveyItem = {
  value: number
  label: string
  surveyInfo: object
}

type EntityCheckItem = {
  entityName: string
  found: boolean
}

type ChainCloneFromSurveyDialogProps = {
  onClose: () => void
}

export const ChainCloneFromSurveyDialog = ({ onClose }: ChainCloneFromSurveyDialogProps): React.ReactElement => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const navigate = useNavigate()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const currentSurvey = useSurvey()
  const currentSurveyId = useSurveyId()

  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [surveyItems, setSurveyItems] = useState<SurveyItem[]>([])
  const [selectedSurveyItem, setSelectedSurveyItem] = useState<SurveyItem | null>(null)
  const [loadingChains, setLoadingChains] = useState(false)
  const [chainItems, setChainItems] = useState<ChainItem[]>([])
  const [selectedChainItem, setSelectedChainItem] = useState<ChainItem | null>(null)
  const [entityCheckItems, setEntityCheckItems] = useState<EntityCheckItem[]>([])
  const [loadingEntityCheck, setLoadingEntityCheck] = useState(false)

  // Collect entity names from the current (target) survey.
  const targetEntityNames = useMemo(
    () => new Set(Survey.getNodeDefsArray(currentSurvey).filter(NodeDef.isEntity).map(NodeDef.getName)),
    [currentSurvey]
  )

  const toChainItem = useCallback(
    (chain: object): ChainItem => ({
      value: Chain.getUuid(chain),
      label: Chain.getLabel(lang)(chain) || Chain.getUuid(chain),
      chain,
    }),
    [lang]
  )

  // Load all surveys with at least one chain (server-side filtered), excluding current.
  const loadSurveys = useCallback(async () => {
    setLoadingSurveys(true)
    try {
      const [publishedSurveys, draftSurveys] = await Promise.all([
        API.fetchSurveys({ draft: false, withChains: true }),
        API.fetchSurveys({ draft: true, withChains: true }),
      ])

      // Deduplicate by survey id, exclude current survey.
      const byId: Record<number, object> = {}
      ;[...publishedSurveys, ...draftSurveys].forEach((surveyInfo) => {
        const id = Survey.getIdSurveyInfo(surveyInfo)
        if (id !== currentSurveyId) byId[id] = surveyInfo
      })

      const items: SurveyItem[] = Object.values(byId)
        .map((surveyInfo) => {
          const surveyLabel = Survey.getLabel(surveyInfo, lang)
          const surveyName = Survey.getName(surveyInfo)
          const label = surveyLabel && surveyLabel !== surveyName ? `${surveyLabel} [${surveyName}]` : surveyName
          return { value: Survey.getIdSurveyInfo(surveyInfo) as number, label, surveyInfo }
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      setSurveyItems(items)
    } catch {
      setSurveyItems([])
    } finally {
      setLoadingSurveys(false)
    }
  }, [currentSurveyId, lang])

  useEffect(() => {
    loadSurveys()
  }, [loadSurveys])

  // When a survey is selected, lazily fetch its chains.
  const onSurveyChange = useCallback(
    async (item: SurveyItem | null) => {
      setSelectedSurveyItem(item)
      setSelectedChainItem(null)
      setChainItems([])
      setEntityCheckItems([])
      if (!item) return
      setLoadingChains(true)
      try {
        const { chains } = await API.fetchChains({ surveyId: item.value } as any)
        setChainItems((chains as object[]).map((chain) => toChainItem(chain)))
      } finally {
        setLoadingChains(false)
      }
    },
    [toChainItem]
  )

  // When a chain is selected, check entity compatibility by fetching the source survey's
  // full node defs (including analysis attributes).
  const onChainChange = useCallback(
    async (item: ChainItem | null) => {
      setSelectedChainItem(item)
      setEntityCheckItems([])
      if (!item || !selectedSurveyItem) return
      setLoadingEntityCheck(true)
      try {
        const sourceSurvey = await API.fetchSurveyFull({
          surveyId: selectedSurveyItem.value,
          advanced: true,
          includeAnalysis: true,
        } as any)
        const chainUuid = item.value
        const sourceAnalysisNodeDefs = Survey.getNodeDefsArray(sourceSurvey).filter(
          (nd: object) => NodeDef.isAnalysis(nd) && NodeDef.getChainUuid(nd) === chainUuid
        )
        // Collect unique parent entity names.
        const parentEntityNames: string[] = []
        sourceAnalysisNodeDefs.forEach((nd: object) => {
          const parentEntity = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nd))(sourceSurvey)
          if (parentEntity) {
            const name = NodeDef.getName(parentEntity)
            if (!parentEntityNames.includes(name)) parentEntityNames.push(name)
          }
        })
        setEntityCheckItems(
          parentEntityNames.map((entityName) => ({
            entityName,
            found: targetEntityNames.has(entityName),
          }))
        )
      } finally {
        setLoadingEntityCheck(false)
      }
    },
    [selectedSurveyItem, targetEntityNames]
  )

  const allEntitiesFound = entityCheckItems.every((c) => c.found)
  const confirmDisabled = !selectedSurveyItem || !selectedChainItem || loadingEntityCheck || !allEntitiesFound

  const onConfirm = useCallback(() => {
    if (!selectedSurveyItem || !selectedChainItem) return
    dispatch(
      ChainActions.cloneChainFromSurvey({
        sourceSurveyId: selectedSurveyItem.value,
        sourceChainUuid: selectedChainItem.value,
        navigate,
      })
    )
    onClose()
  }, [dispatch, navigate, onClose, selectedChainItem, selectedSurveyItem])

  return (
    <Modal
      className="chain-clone-from-survey-dialog"
      onClose={onClose}
      showCloseButton
      title={i18n.t('chainView.cloneFromAnotherSurveyDialog.title')}
    >
      <ModalBody>
        <FormItem label={i18n.t('chainView.cloneFromAnotherSurveyDialog.sourceSurvey')}>
          <Dropdown
            disabled={loadingSurveys}
            items={surveyItems}
            onChange={onSurveyChange}
            placeholder={loadingSurveys ? i18n.t('common.loading') : i18n.t('common.select')}
            selection={selectedSurveyItem}
          />
        </FormItem>

        <FormItem label={i18n.t('chainView.cloneFromAnotherSurveyDialog.sourceChain')}>
          <Dropdown
            disabled={!selectedSurveyItem || loadingChains}
            items={chainItems}
            onChange={onChainChange}
            placeholder={loadingChains ? i18n.t('common.loading') : i18n.t('common.select')}
            selection={selectedChainItem}
          />
        </FormItem>

        {selectedChainItem && !loadingEntityCheck && entityCheckItems.length > 0 && (
          <FormItem label={i18n.t('chainView.cloneFromAnotherSurveyDialog.entityCheck')}>
            <div className="chain-clone-from-survey-dialog__entity-check-list">
              {entityCheckItems.map(({ entityName, found }) => (
                <div key={entityName} className={found ? 'found' : 'missing'}>
                  <span
                    className={`icon icon-12px ${
                      found
                        ? 'icon-checkmark chain-clone-from-survey-dialog__entity-icon--found'
                        : 'icon-cross chain-clone-from-survey-dialog__entity-icon--missing'
                    }`}
                  />
                  {entityName}
                  {!found && (
                    <span className="chain-clone-from-survey-dialog__entity-missing-label">
                      {' '}
                      ({i18n.t('chainView.cloneFromAnotherSurveyDialog.entityMissing')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FormItem>
        )}

        {selectedChainItem && !loadingEntityCheck && entityCheckItems.length === 0 && (
          <div className="chain-clone-from-survey-dialog__no-analysis-attrs">
            {i18n.t('chainView.cloneFromAnotherSurveyDialog.noAnalysisAttributes')}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button className="modal-footer__item" disabled={confirmDisabled} label="common.clone" onClick={onConfirm} />
      </ModalFooter>
    </Modal>
  )
}
