import './AiExpressionPopup.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import * as API from '@webapp/service/api'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyId } from '@webapp/store/survey'

import { ADVANCED_EXPRESSION_SUFFIX } from '@webapp/components/expression/expressionEditorPopupState'

const expressionTypeFromQualifier = (qualifier) => {
  if (!qualifier) return 'validation'
  if (qualifier.includes('applyIf')) return 'applicableIf'
  if (qualifier.includes('default')) return 'defaultValue'
  return 'validation'
}

const AiExpressionPopup = (props) => {
  const { excludeCurrentNodeDef = true, isContextParent = false, qualifier, nodeDefUuid, onCancel, onApply } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const textareaRef = useRef(null)

  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const expressionType = expressionTypeFromQualifier(qualifier)
  // result.isValid is only a server-side syntax check; validationError catches semantic issues too
  const isValid = Boolean(result?.isValid) && !validationError

  const onGenerate = async () => {
    if (!description.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setValidationError(null)
    try {
      const res = await API.aiExpression.generate({
        surveyId,
        nodeDefUuid,
        expressionType,
        description: description.trim(),
      })
      setResult(res)
      if (res.isValid && res.expression) {
        const nodeDefCurrent = nodeDefUuid ? Survey.getNodeDefByUuid(nodeDefUuid)(survey) : null
        const validatorError = await NodeDefExpressionValidator.validate({
          survey,
          nodeDefCurrent,
          exprString: res.expression,
          isContextParent,
          selfReferenceAllowed: !excludeCurrentNodeDef,
        })
        setValidationError(validatorError)
      }
    } catch (err) {
      const key = err?.response?.data?.error?.key || err?.response?.data?.errorKey
      const params = err?.response?.data?.error?.params || err?.response?.data?.errorParams
      const fallback = err?.message || 'unknown'
      setError(key ? i18n.t(`appErrors:${key}`, params) : fallback)
    } finally {
      setBusy(false)
    }
  }

  const onTryAgain = () => {
    setResult(null)
    setValidationError(null)
  }

  const onUse = () => {
    if (result?.expression) onApply(`${result.expression.trimEnd()}${ADVANCED_EXPRESSION_SUFFIX}`)
  }

  return (
    <Modal className="ai-expression-popup" title="aiExpression.title" showCloseButton onClose={onCancel}>
      <ModalBody>
        <div className="ai-expression-popup__hint">{i18n.t('aiExpression.hint')}</div>

        <textarea
          ref={textareaRef}
          className="ai-expression-popup__textarea"
          placeholder={i18n.t('aiExpression.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate()
          }}
        />

        {result ? (
          <>
            <div className={`ai-expression-popup__result${isValid ? '' : ' ai-expression-popup__result--invalid'}`}>
              {result.expression}
            </div>
            <div className="ai-expression-popup__explanation">{result.explanation}</div>
            {!result.isValid && result.parseError ? (
              <div className="ai-expression-popup__error">
                {i18n.t('aiExpression.parseError', { message: result.parseError })}
              </div>
            ) : null}
            {result.isValid && validationError ? (
              <div className="ai-expression-popup__error">{i18n.t(validationError.key, validationError.params)}</div>
            ) : null}
          </>
        ) : null}

        {error ? <div className="ai-expression-popup__error">{error}</div> : null}
      </ModalBody>

      <ModalFooter>
        <Button label="common.cancel" onClick={onCancel} disabled={busy} variant="outlined" />
        {result ? (
          <>
            <Button label="aiExpression.tryAgain" onClick={onTryAgain} disabled={busy} />
            <Button
              className="btn-primary"
              label={isValid ? 'aiExpression.use' : 'aiExpression.useAnyway'}
              onClick={onUse}
              disabled={busy}
            />
          </>
        ) : (
          <Button
            className="btn-primary"
            label={busy ? 'aiExpression.generating' : 'aiExpression.generate'}
            onClick={onGenerate}
            disabled={busy || !description.trim()}
          />
        )}
      </ModalFooter>
    </Modal>
  )
}

AiExpressionPopup.propTypes = {
  excludeCurrentNodeDef: PropTypes.bool,
  isContextParent: PropTypes.bool,
  qualifier: PropTypes.string,
  nodeDefUuid: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
}

export default AiExpressionPopup
