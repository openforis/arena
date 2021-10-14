import './nodeDefTaxon.scss'

import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import * as Taxon from '@core/survey/taxon'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as StringUtils from '@core/stringUtils'

import { SurveyState } from '@webapp/store/survey'
import NodeDefTaxonInputField from './nodeDefTaxonInputField'
import { TestId } from '@webapp/utils/testId'

const { code, scientificName, vernacularName, vernacularNameUuid, taxonUuid } = Node.valuePropsTaxon

const selectionDefault = {
  [code]: '',
  [scientificName]: '',
  [vernacularName]: '',
}

const NodeDefTaxon = (props) => {
  const { surveyId, nodeDef, taxonomyUuid, node, edit, draft, renderType, canEditRecord, readOnly, updateNode } = props

  const [selection, setSelection] = useState(selectionDefault)
  const elementRef = useRef(null)

  const i18n = useI18n()
  const taxonRefData = edit ? null : NodeRefData.getTaxon(node)

  const updateSelectionFromNode = () => {
    const unlisted = taxonRefData && Taxon.isUnlistedTaxon(taxonRefData)
    const selectionUpdate = taxonRefData
      ? {
          [code]: Taxon.getCode(taxonRefData),
          [scientificName]: unlisted ? Node.getScientificName(node) : Taxon.getScientificName(taxonRefData),
          [vernacularName]: unlisted ? Node.getVernacularName(node) : R.defaultTo('', taxonRefData[vernacularName]),
        }
      : selectionDefault

    setSelection(selectionUpdate)
  }

  const updateNodeValue = (nodeValue, taxon = null) =>
    updateNode(nodeDef, node, nodeValue, null, {}, { [NodeRefData.keys.taxon]: taxon })

  const onChangeTaxon = (taxon) => {
    if (taxon && !Taxon.isEqual(taxon)(taxonRefData)) {
      const nodeValue = {
        [taxonUuid]: Taxon.getUuid(taxon),
      }
      if (Taxon.isUnlistedTaxon(taxon)) {
        if (selection[scientificName]) {
          nodeValue[scientificName] = selection[scientificName]
        }
        if (selection[vernacularName]) {
          nodeValue[vernacularName] = selection[vernacularName]
        }
        if (Taxon.getVernacularNameUuid(taxon)) {
          nodeValue[vernacularNameUuid] = Taxon.getVernacularNameUuid(taxon)
        }
      }

      updateNodeValue(nodeValue, taxon)
    } else {
      // Reset to last node value
      updateSelectionFromNode()
    }
  }

  const onChangeSelectionField = (field, value) => {
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
  }

  if (!edit) {
    useEffect(updateSelectionFromNode, [
      Taxon.getUuid(taxonRefData),
      Node.getScientificName(node),
      Node.getVernacularName(node),
    ])
  }

  const isTableBody = renderType === NodeDefLayout.renderType.tableBody
  const className = isTableBody
    ? 'survey-form__node-def-table-cell-taxon survey-form__node-def-table-cell-composite'
    : 'survey-form__node-def-taxon'

  return (
    <div className={className} ref={elementRef}>
      {R.keys(selectionDefault).map((field) => {
        const inputField = (
          <NodeDefTaxonInputField
            id={TestId.surveyForm.taxonField(NodeDef.getName(nodeDef), field)}
            key={field}
            surveyId={surveyId}
            taxonomyUuid={taxonomyUuid}
            edit={edit}
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

        return isTableBody ? (
          inputField
        ) : (
          <FormItem key={field} label={i18n.t(`surveyForm.nodeDefTaxon.${field}`)}>
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
