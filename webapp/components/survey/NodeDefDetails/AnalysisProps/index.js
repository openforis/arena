import './AnalysisProps.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Chain from '@common/analysis/chain'

import { useI18n, useLang } from '@webapp/store/system'
import { useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey, useSurveyCycleKeys, useSurveyInfo, NodeDefsActions } from '@webapp/store/survey'
import * as API from '@webapp/service/api'
import { useDispatch } from 'react-redux'
import Checkbox from '@webapp/components/form/checkbox'

const AreaBasedEstimated = (props) => {
  const { state, Actions, nodeDef } = props
  const [areaBasedEstimatedNodeDef, setAreaBasedEstimatedNodeDef] = useState(false)

  const dispatch = useDispatch()

  const survey = useSurvey()
  const cycleKeys = useSurveyCycleKeys()
  const surveyInfo = useSurveyInfo()
  const chain = useChain()

  const i18n = useI18n()
  const lang = useLang()

  useEffect(() => {
    const _areaBasedEstimatedNodeDef = Survey.getNodeDefAreaBasedStimate(nodeDef)(survey)
    if (_areaBasedEstimatedNodeDef) {
      setAreaBasedEstimatedNodeDef(_areaBasedEstimatedNodeDef)
    }
  }, [nodeDef])

  const handleSwitchAreaBasedEstimated = async (value) => {
    if (value) {
      const chainUuid = Chain.getUuid(chain)
      const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)
      const parentName = NodeDef.getName(parentNodeDef)

      const name = `${NodeDef.getName(nodeDef)}_ha`

      const samplingNodeDefInParent = Survey.getNodeDefsArray(survey).find(
        (_nodeDef) => NodeDef.isSampling(_nodeDef) && NodeDef.getParentUuid(_nodeDef) === NodeDef.getUuid(parentNodeDef)
      )

      const props = {
        [NodeDef.propKeys.name]: name,
      }

      const advancedProps = {
        [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
        [NodeDef.keysPropsAdvanced.active]: true,
        [NodeDef.keysPropsAdvanced.isBaseUnit]: false,
        [NodeDef.keysPropsAdvanced.isSampling]: true,
        [NodeDef.keysPropsAdvanced.areaBasedEstimatedOf]: NodeDef.getUuid(nodeDef),
        [NodeDef.keysPropsAdvanced.script]: `${parentName}$${name} <- ${parentName}$${NodeDef.getName(
          nodeDef
        )} / ${parentName}$${NodeDef.getName(samplingNodeDefInParent)}`,
      }

      const temporary = true
      const virtual = false
      const nodeDefType = NodeDef.nodeDefType.decimal

      const _nodeDef = NodeDef.newNodeDef(
        parentNodeDef,
        nodeDefType,
        cycleKeys,
        props,
        advancedProps,
        temporary,
        virtual
      )

      dispatch(NodeDefsActions.postNodeDef({ nodeDef: _nodeDef }))

      setAreaBasedEstimatedNodeDef(_nodeDef)
    } else {
      dispatch(NodeDefsActions.removeNodeDef(areaBasedEstimatedNodeDef))
      setAreaBasedEstimatedNodeDef(false)
    }
  }

  return (
    <>
      {NodeDef.isDecimal(nodeDef) && !NodeDef.isSampling(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.advancedProps.areaBasedEstimate')} className="">
          <Checkbox checked={!!areaBasedEstimatedNodeDef} onChange={handleSwitchAreaBasedEstimated} />
        </FormItem>
      )}
    </>
  )
}

const AnalysisProps = (props) => {
  const [defaultLocalScript, setDefaultLocalScript] = useState('')

  const { state, Actions, nodeDef } = props
  const survey = useSurvey()

  const i18n = useI18n()
  const lang = useLang()

  const nodeDefItems = Survey.getNodeDefsArray(survey).map((_nodeDef) => {
    const parent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(_nodeDef))(survey)
    return {
      name: NodeDef.getName(_nodeDef),
      label: NodeDef.getLabel(_nodeDef, lang),
      parent,
    }
  })

  const variableNamesCompleter = {
    getCompletions: (_editor, _session, _pos, _prefix, callback) => {
      callback(
        null,
        nodeDefItems.map((_nodeDef) => ({
          caption: `${_nodeDef.name}: ${_nodeDef.label}`,
          value: `${NodeDef.getName(_nodeDef.parent)}$${_nodeDef.name}`,
          meta: 'Table',
        }))
      )
    },
  }
  const onChange = (newValue) => {
    Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.script, value: newValue })
  }

  const getDefaultScript = () =>
    `${NodeDef.getName(Survey.getNodeDefParent(nodeDef)(survey)) || 'PARENT'}$${
      NodeDef.getName(nodeDef) || 'NAME'
    } <- NA`

  const getScriptOrDefault = () => NodeDef.getScript(nodeDef) || getDefaultScript()

  const generatePreScriptWithCategories = async () => {
    const { request } = API.fetchCategoryItems({
      surveyId: Survey.getId(survey),
      categoryUuid: NodeDef.getCategoryUuid(nodeDef),
    })
    const {
      data: { items },
    } = await request

    const currentScript = NodeDef.getScript(nodeDef)
    let newScript = ''
    const generateCodesText = (_items) =>
      Object.values(_items)
        .map((_item) => `'${CategoryItem.getCode(_item)}', ${CategoryItem.getLabel(lang)(_item)} `)
        .join('; ')

    if (NodeDef.getParentUuid(nodeDef) && NodeDef.getCategoryUuid(nodeDef)) {
      if (/^# __CODES__/.test(currentScript)) {
        const scriptSplitted = currentScript.split('\n')
        scriptSplitted[0] = `# __CODES__ ${generateCodesText(items)}`
        newScript = scriptSplitted.join('\n')
      } else {
        newScript = `# __CODES__ ${generateCodesText(items)}\n${getScriptOrDefault()}`
      }
    }

    onChange(newScript)
    setDefaultLocalScript(newScript)
  }

  useEffect(() => {
    if (NodeDef.getCategoryUuid(nodeDef)) {
      generatePreScriptWithCategories()
    }
  }, [NodeDef.getCategoryUuid(nodeDef), NodeDef.getParentUuid(nodeDef)])

  useEffect(() => {
    setDefaultLocalScript(getScriptOrDefault())
  }, [])

  return (
    <>
      <AreaBasedEstimated nodeDef={nodeDef} state={state} Actions={Actions} />
      <FormItem label={i18n.t('nodeDefEdit.advancedProps.script')} className="script-form">
        <ScriptEditor
          key={defaultLocalScript}
          name="node_def_analysis_script"
          mode="r"
          script={defaultLocalScript}
          onChange={onChange}
          completer={variableNamesCompleter}
        />
      </FormItem>
    </>
  )
}

AnalysisProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AnalysisProps
