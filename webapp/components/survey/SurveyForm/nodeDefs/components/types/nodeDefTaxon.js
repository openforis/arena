import './nodeDefTaxon.scss'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'

import * as Taxon from '@core/survey/taxon'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as StringUtils from '@core/stringUtils'

import { TestId } from '@webapp/utils/testId'
import { SurveyState, useSurveyPreferredLang } from '@webapp/store/survey'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import NodeDefTaxonInputField from './nodeDefTaxonInputField'

const { code, scientificName, vernacularName, vernacularNameUuid, taxonUuid } = Node.valuePropsTaxon

const selectionDefault = {
  [code]: '',
  [scientificName]: '',
  [vernacularName]: '',
}

const NodeDefTaxon = (props) => {
  const {
    surveyId,
    nodeDef,
    node,
    parentNode,
    edit,
    draft,
    renderType,
    canEditRecord,
    readOnly,
    updateNode,
    entryDataQuery,
  } = props

  const [selection, setSelection] = useState(selectionDefault)
  const elementRef = useRef(null)

  const lang = useSurveyPreferredLang()
  const taxonRefData = edit ? null : NodeRefData.getTaxon(node)
  const visibleFields = useMemo(() => NodeDef.getVisibleFields(nodeDef), [nodeDef])

  const updateSelectionFromNode = useCallback(() => {
    const unkOrUnl = taxonRefData && Taxon.isUnkOrUnlTaxon(taxonRefData)
    const selectionUpdate = taxonRefData
      ? {
          [code]: Taxon.getCode(taxonRefData),
          [scientificName]: unkOrUnl ? Node.getScientificName(node) : Taxon.getScientificName(taxonRefData),
          [vernacularName]: unkOrUnl ? Node.getVernacularName(node) : R.defaultTo('', taxonRefData[vernacularName]),
        }
      : selectionDefault

    setSelection(selectionUpdate)
  }, [node, taxonRefData])

  const updateNodeValue = useCallback(
    (nodeValue, taxon = null) => updateNode(nodeDef, node, nodeValue, null, {}, { [NodeRefData.keys.taxon]: taxon }),
    [node, nodeDef, updateNode]
  )

  const onChangeTaxon = useCallback(
    (selectedTaxon) => {
      if (
        selectedTaxon &&
        (!Taxon.isEqual(selectedTaxon)(taxonRefData) ||
          Taxon.getVernacularNameUuid(selectedTaxon) !== Taxon.getVernacularNameUuid(taxonRefData))
      ) {
        const nodeValue = {
          [taxonUuid]: Taxon.getUuid(selectedTaxon),
        }
        if (Taxon.isUnkOrUnlTaxon(selectedTaxon)) {
          if (selection[scientificName]) {
            nodeValue[scientificName] = selection[scientificName]
          }
          if (selection[vernacularName]) {
            nodeValue[vernacularName] = selection[vernacularName]
          }
        }
        if (Taxon.getVernacularNameUuid(selectedTaxon)) {
          nodeValue[vernacularNameUuid] = Taxon.getVernacularNameUuid(selectedTaxon)
        }

        updateNodeValue(nodeValue, selectedTaxon)
      } else {
        // Reset to last node value
        updateSelectionFromNode()
      }
    },
    [selection, taxonRefData, updateNodeValue, updateSelectionFromNode]
  )

  const onChangeSelectionField = useCallback(
    (field, value) => {
      if (StringUtils.isBlank(value)) {
        if (Node.isValueBlank(node)) {
          setSelection(selectionDefault)
        } else if (field === vernacularName && selection[code] === Taxon.unlistedCode) {
          // If current code is UNL and vernacular name is reset, do not clear node value
          updateNodeValue({ ...Node.getValue(node), [field]: value }, taxonRefData)
        } else {
          // Clear node value
          updateNodeValue({})
        }
      } else if (field !== code && selection[code] === Taxon.unlistedCode) {
        // If input field is not code and current code is UNL, update node value field
        updateNodeValue({ ...Node.getValue(node), [field]: value }, taxonRefData)
      } else {
        setSelection({ ...selectionDefault, [field]: value })
      }
    },
    [node, selection, taxonRefData, updateNodeValue]
  )

  useEffect(() => {
    if (!edit) {
      updateSelectionFromNode()
    }
  }, [
    edit,
    updateSelectionFromNode,
    Taxon.getUuid(taxonRefData),
    Taxon.getVernacularNameUuid(taxonRefData),
    Node.getScientificName(node),
    Node.getVernacularName(node),
  ])

  const isTableBody = renderType === NodeDefLayout.renderType.tableBody
  const className = isTableBody
    ? 'survey-form__node-def-table-cell-taxon survey-form__node-def-table-cell-composite'
    : 'survey-form__node-def-taxon'

  return (
    <div className={className} ref={elementRef}>
      {visibleFields.map((field) => {
        const inputField = (
          <NodeDefTaxonInputField
            id={TestId.surveyForm.taxonField(NodeDef.getName(nodeDef), field)}
            key={field}
            surveyId={surveyId}
            nodeDef={nodeDef}
            parentNode={parentNode}
            edit={edit}
            entryDataQuery={entryDataQuery}
            draft={draft}
            canEditRecord={canEditRecord}
            readOnly={readOnly}
            field={field}
            selection={selection}
            onChangeTaxon={onChangeTaxon}
            onChangeSelectionField={onChangeSelectionField}
            autocompleteSourceElement={isTableBody ? elementRef.current : null}
          />
        )

        if (isTableBody) {
          return (
            <div key={field} style={{ flex: NodeDefUIProps.getTableColumnFlex(field)(nodeDef) }}>
              {inputField}
            </div>
          )
        }
        const fieldLabelKey =
          (field === vernacularName ? NodeDef.getVernacularNameLabel(lang)(nodeDef) : null) ||
          `surveyForm.nodeDefTaxon.${field}`
        return (
          <FormItem key={field} label={fieldLabelKey}>
            {inputField}
          </FormItem>
        )
      })}
    </div>
  )
}

const mapStateToProps = (state, props) => {
  const surveyId = SurveyState.getSurveyId(state)
  const { nodeDef, edit, preview, nodes } = props

  return {
    taxonomyUuid: NodeDef.getTaxonomyUuid(nodeDef),
    surveyId,
    draft: preview,
    node: edit ? null : nodes[0],
  }
}

export default connect(mapStateToProps)(NodeDefTaxon)

NodeDefTaxon.propTypes = {
  canEditRecord: PropTypes.bool,
  draft: PropTypes.bool,
  edit: PropTypes.bool,
  entryDataQuery: PropTypes.bool,
  node: PropTypes.object,
  nodeDef: PropTypes.object.isRequired,
  parentNode: PropTypes.object,
  readOnly: PropTypes.bool,
  renderType: PropTypes.string,
  surveyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  updateNode: PropTypes.func.isRequired,
}
