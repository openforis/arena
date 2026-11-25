import '../aiTextarea.scss'
import './AiExpressionPopup.scss'

import { useEffect, useRef, useState } from 'react'

import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Survey from '@core/survey/survey'
import { AiWorkflows, getAiErrorMessage } from '@webapp/ai/workflows'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { Button } from '@webapp/components/buttons'
import { ADVANCED_EXPRESSION_SUFFIX } from '@webapp/components/expression/expressionEditorPopupState'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/Modal'
import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const expressionTypeFromQualifier = (qualifier) => {
  if (!qualifier) return 'validation'
  if (qualifier.includes('applyIf')) return 'applicableIf'
  if (qualifier.includes('default')) return 'defaultValue'
  return 'validation'
}

const unusableErrorKeys = new Set([
  'expression.identifierNotFound',
  'expression.undefinedFunction',
  'expression.invalidCategoryName',
  'expression.invalidTaxonomyName',
])

/**
 * Shows the generated expression, its explanation and the related errors, if any.
 * @param {!object} props - The component props.
 * @param {!object} props.result - The result returned by the AI expression API.
 * @param {object} [props.validationError] - The validation error, if any.
 * @param {boolean} props.isValid - Whether the expression is valid.
 * @param {!object} props.i18n - The i18n instance.
 * @returns {React.ReactElement} - The rendered result.
 */
type ExpressionResultProps = {
  result: Record<string, any>
  validationError?: Record<string, any>
  isValid: boolean
  i18n: Record<string, any>
}

const ExpressionResult = ({ result, validationError = null, isValid, i18n }: ExpressionResultProps) => (
  <>
    <div className={`ai-expression-popup__result${isValid ? '' : ' ai-expression-popup__result--invalid'}`}>
      {result.expression}
    </div>
    <div className="ai-expression-popup__explanation">{result.explanation}</div>
    {!result.isValid && result.parseError ? (
      <div className="ai-expression-popup__error" role="alert">
        {i18n.t('aiExpression.parseError', { message: result.parseError })}
      </div>
    ) : null}
    {result.isValid && validationError ? (
      <div className="ai-expression-popup__error" role="alert">
        {i18n.t(validationError.key, validationError.params)}
      </div>
    ) : null}
  </>
)

type AiExpressionPopupProps = {
  excludeCurrentNodeDef?: boolean
  qualifier?: string
  nodeDefUuid?: string
  onCancel: (...args: any[]) => any
  onApply: (...args: any[]) => any
}

const AiExpressionPopup = (props: AiExpressionPopupProps) => {
  const { excludeCurrentNodeDef = true, qualifier, nodeDefUuid, onCancel, onApply } = props

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
  // an expression that references something missing can never work: no "Use anyway"
  const usable = isValid || !unusableErrorKeys.has(validationError?.key)

  const onGenerate = async () => {
    if (!description.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setValidationError(null)
    try {
      const res = await AiWorkflows.generateExpression({
        survey,
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
          selfReferenceAllowed: !excludeCurrentNodeDef,
        })
        setValidationError(validatorError)
      }
    } catch (err) {
      setError(err)
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
        <AiFeatureDataLocationBadge feature="expressionGenerate" />
        <div className="ai-expression-popup__hint">{i18n.t('aiExpression.hint')}</div>

        <textarea
          ref={textareaRef}
          className="ai-textarea"
          aria-label={i18n.t('aiExpression.placeholder')}
          placeholder={i18n.t('aiExpression.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void onGenerate()
            }
          }}
        />

        {result ? (
          <ExpressionResult result={result} validationError={validationError} isValid={isValid} i18n={i18n} />
        ) : null}

        {error ? (
          <div className="ai-expression-popup__error" role="alert">
            {getAiErrorMessage({ error, i18n })}
            <AiEngineErrorActions disabled={busy} error={error} onRetry={() => void onGenerate()} />
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <Button label="common.cancel" onClick={onCancel} disabled={busy} variant="outlined" />
        {result ? (
          <>
            <Button label="aiExpression.tryAgain" onClick={onTryAgain} disabled={busy} />
            {usable ? (
              <Button
                className="btn-primary"
                label={isValid ? 'aiExpression.use' : 'aiExpression.useAnyway'}
                onClick={onUse}
                disabled={busy}
              />
            ) : null}
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

export default AiExpressionPopup
