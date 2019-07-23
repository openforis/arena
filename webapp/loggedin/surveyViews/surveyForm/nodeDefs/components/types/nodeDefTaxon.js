import './nodeDefTaxon.scss'

import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import * as R from 'ramda'

import { FormItem } from '../../../../../../commonComponents/form/input'
import useI18n from '../../../../../../commonComponents/useI18n'
import NodeDefTaxonInputField from './nodeDefTaxonInputField'

import Survey from '../../../../../../../common/survey/survey'
import Taxon from '../../../../../../../common/survey/taxon'
import NodeDef from '../../../../../../../common/survey/nodeDef'
import Node from '../../../../../../../common/record/node'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'
import StringUtils from '../../../../../../../common/stringUtils'

import * as SurveyState from '../../../../../../survey/surveyState'

const code = Node.valuePropKeys.code
const scientificName = Node.valuePropKeys.scientificName
const vernacularName = Node.valuePropKeys.vernacularName
const vernacularNameUuid = Node.valuePropKeys.vernacularNameUuid
const taxonUuid = Node.valuePropKeys.taxonUuid

const selectionDefault = {
  [code]: '',
  [scientificName]: '',
  [vernacularName]: '',
}

const loadTaxonByNode = async (surveyId, taxonomyUuid, draft, node) => {
  const params = {
    [taxonUuid]: Node.getTaxonUuid(node),
    [vernacularNameUuid]: Node.getVernacularNameUuid(node),
    draft,
  }
  const { data: { taxon } } = await axios.get(
    `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxon`,
    { params }
  )
  return taxon
}

const NodeDefTaxon = props => {
  const {
    surveyId, nodeDef, taxonomyUuid, node,
    edit, draft, renderType,
    canEditRecord, readOnly,
    updateNode,
  } = props

  const [selection, setSelection] = useState(selectionDefault)

  const i18n = useI18n()

  const isTableBody = renderType === NodeDefLayout.nodeDefRenderType.tableBody
  const className = isTableBody
    ? 'survey-form__node-def-table-cell-taxon survey-form__node-def-table-cell-composite'
    : 'survey-form__node-def-taxon'

  const updateSelectionFromNode = () => {
    //TODO remove async call when using pre-fetched taxon
    (async () => {
      const taxon = Node.isValueBlank(node)
        ? null
        : await loadTaxonByNode(surveyId, taxonomyUuid, draft, node)

      const unlisted = taxon && Taxon.isUnlistedTaxon(taxon)

      const selectionUpdate = taxon ?
        {
          [code]: Taxon.getCode(taxon),
          [scientificName]: unlisted
            ? Node.getScientificName(node)
            : Taxon.getScientificName(taxon),
          [vernacularName]: unlisted
            ? Node.getVernacularName(node)
            : R.defaultTo('', taxon[vernacularName]),
        }
        : selectionDefault

      setSelection(selectionUpdate)
    })()
  }

  const updateNodeValue = nodeValue => updateNode(nodeDef, node, nodeValue)

  const onChangeTaxon = taxon => {
    if (taxon) {
      const nodeValue = {
        [taxonUuid]: Taxon.getUuid(taxon),
        [scientificName]: Taxon.isUnlistedTaxon(taxon) && selection[scientificName]
          ? selection[scientificName]
          : Taxon.getScientificName(taxon),
        [vernacularName]: Taxon.isUnlistedTaxon(taxon) && selection[vernacularName]
          ? selection[vernacularName]
          : '',
        [vernacularNameUuid]: taxon[vernacularNameUuid]
      }

      updateNodeValue(nodeValue)
    } else {
      // reset to last node value
      updateSelectionFromNode()
    }
  }

  const onChangeSelectionField = (field, value) => {
    if (StringUtils.isBlank(value)) {
      Node.isValueBlank(node)
        ? setSelection(selectionDefault)
        : updateNodeValue({})
    } else if (field !== code && selection[code] === Taxon.unlistedCode) {
      // if input field is not code and current code is UNL, update node value field
      updateNodeValue({ ...Node.getValue(node), [field]: value })
    } else {
      setSelection({ ...selectionDefault, [field]: value })
    }
  }

  if (!edit) {
    const valueTaxonUuid = Node.getTaxonUuid(node)
    const valueScientificName = Node.getScientificName(node)
    const valueVernacularName = Node.getVernacularName(node)
    const valueVernacularNameUuid = Node.getVernacularNameUuid(node)
    useEffect(
      updateSelectionFromNode,
      [valueTaxonUuid, valueScientificName, valueVernacularName, valueVernacularNameUuid]
    )
  }

  return (
    <div className={className}>

      {
        R.keys(selection).map(field => {
            const inputField = (
              <NodeDefTaxonInputField
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
              />
            )

            return isTableBody
              ? (
                inputField
              )
              : (
                <FormItem
                  key={field}
                  label={i18n.t(`surveyForm.nodeDefTaxon.${field}`)}>
                  {inputField}
                </FormItem>
              )
          }
        )
      }

    </div>
  )
}

const mapStateToProps = (state, props) => {

  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyId = SurveyState.getSurveyId(state)
  const { nodeDef, edit, nodes } = props

  return {
    taxonomyUuid: NodeDef.getTaxonomyUuid(nodeDef),
    surveyId,
    draft: Survey.isDraft(surveyInfo),
    node: edit ? null : nodes[0]
  }
}

export default connect(mapStateToProps)(NodeDefTaxon)
