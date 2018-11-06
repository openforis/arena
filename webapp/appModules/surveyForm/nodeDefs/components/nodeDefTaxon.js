import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom'
import axios from 'axios'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import AutocompleteDialog from '../../../../commonComponents/form/autocompleteDialog'

import { toQueryString } from '../../../../../server/serverUtils/request'

import Survey from '../../../../../common/survey/survey'
import Taxon from '../../../../../common/survey/taxonomy'
import NodeDef from '../../../../../common/survey/nodeDef'
import Node from '../../../../../common/record/node'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'
import { getNodeDefDefaultValue } from '../nodeDefSystemProps'
import { getSurvey } from '../../../../survey/surveyState'

const fields = {
  code: 'code',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

const TaxonAutocompleteItemRenderer = props => {
  const {item: taxon, ...otherProps} = props

  const vernacularNames = Taxon.getTaxonVernacularNames(taxon)
  const vernacularNamesString = R.pipe(
    R.keys, //vernacular language codes
    R.map(langCode => `${langCode}: ${R.prop(langCode, vernacularNames)}`),
    R.join(' / ')
  )(vernacularNames)

  return <div {...otherProps}
              key={taxon.uuid}
              className="item"
              tabIndex="1">
    <div>{Taxon.getTaxonCode(taxon)}</div>
    <div>{Taxon.getTaxonScientificName(taxon)}</div>
    <div style={{gridColumn: 2}}>{vernacularNamesString}</div>
  </div>
}

class NodeDefTaxon extends React.Component {

  constructor (props) {
    super(props)

    this.codeField = React.createRef()
    this.scientificNameField = React.createRef()
    this.vernacularNameField = React.createRef()

    const value = this.getTaxonNodeValue()

    this.state = {
      ...value,
      dirty: false,
      autocompleteOpened: false,
      autocompleteTaxa: [],
      autocompleteInputField: null,
    }
  }

  getInputFields () {
    return {
      code: this.codeField,
      scientificName: this.scientificNameField,
      vernacularName: this.vernacularNameField,
    }
  }

  getTaxonNodeValue () {
    const {nodeDef, edit, nodes} = this.props
    const node = edit ? null : nodes[0]

    return Node.getNodeValue(node, getNodeDefDefaultValue(nodeDef))
  }

  async onInputFieldChange (field, value) {
    //reset other fields values

    const fieldValues = R.assoc(field, value)(getNodeDefDefaultValue(this.props.nodeDef))

    const autocompleteOpened = !R.isEmpty(value)

    //reset stored value
    this.updateNodeValue(null)

    this.setState({
      ...fieldValues,
      dirty: true,
      autocompleteOpened,
      autocompleteTaxa: [],
      autocompleteInputField: this.getInputFields()[field]
    })

    if (autocompleteOpened) {
      await this.loadTaxa(field, value)
    }
  }

  onTaxonSelect (taxonSearchResult) {
    const value = {
      code: Taxon.getTaxonCode(taxonSearchResult),
      family: Taxon.getTaxonFamily(taxonSearchResult),
      genus: Taxon.getTaxonGenus(taxonSearchResult),
      scientificName: Taxon.getTaxonScientificName(taxonSearchResult),
    }
    const nodeValue = taxonSearchResult.vernacularName
      ? R.pipe(
        R.assoc('vernacularName', R.prop('vernacularName', taxonSearchResult)),
        R.assoc('vernacularLanguage', R.prop('vernacularLanguage', taxonSearchResult))
      )(value)
      : value

    this.onValueChange(nodeValue)

    this.updateNodeValue(nodeValue)
  }

  updateNodeValue (value) {
    const {nodeDef, nodes, updateNode} = this.props

    updateNode(nodeDef, nodes[0], value)
  }

  onAutocompleteClose () {
    //reset value
    this.onValueChange(null)
  }

  onValueChange (value) {
    this.setState({
      ...value,
      dirty: false,
      autocompleteOpened: false,
      autocompleteTaxa: [],
      autocompleteInputField: null,
    })
  }

  async loadTaxa (field, value) {
    const {surveyInfo, taxonomy} = this.props

    const params = {
      draft: false,
      limit: 20,
      offset: 0,
      filter: {
        [field]: value,
      }
    }

    const {data} = await axios.get(`/api/survey/${surveyInfo.id}/taxonomies/${taxonomy.id}/taxa?${toQueryString(params)}`)
    this.setState({autocompleteTaxa: data.taxa})
  }

  render () {
    const {
      edit, label, renderType
    } = this.props

    const {
      code,
      scientificName,
      vernacularName,

      autocompleteOpened,
      autocompleteTaxa,
      autocompleteInputField,
    } = this.state

    // table header
    if (renderType === nodeDefRenderType.tableHeader) {
      return <div className="node-def__table-row-taxon">
        <label className="node-def__table-header" style={{gridColumn: '1 / span 4'}}>
          {label}
        </label>
        <label className="node-def__table-header">Code</label>
        <label className="node-def__table-header">Scientific Name</label>
        <label className="node-def__table-header">Vernacular Name</label>
      </div>
    }

    const codeInputField = <Input ref={this.codeField}
                                  readOnly={edit}
                                  value={code}
                                  onChange={(e) => this.onInputFieldChange(fields.code, e.target.value)}/>

    const scientificNameInputField = <Input ref={this.scientificNameField}
                                            readOnly={edit}
                                            value={scientificName}
                                            onChange={(e) => this.onInputFieldChange(fields.scientificName, e.target.value)}/>

    const vernacularNameInputField = <Input ref={this.vernacularNameField}
                                            readOnly={edit}
                                            value={vernacularName}
                                            onChange={(e) => this.onInputFieldChange(fields.vernacularName, e.target.value)}/>

    const autocompleteDialog =
      autocompleteOpened
        ? ReactDOM.createPortal(
        <AutocompleteDialog className="node-def__taxon-autocomplete-list"
                            items={autocompleteTaxa}
                            itemRenderer={TaxonAutocompleteItemRenderer}
                            itemKeyFunction={taxon => `${taxon.uuid}_${taxon.vernacularName}`}
                            inputField={autocompleteInputField.current.component.input}
                            onItemSelect={taxonSearchResult => this.onTaxonSelect(taxonSearchResult)}
                            onClose={() => this.onAutocompleteClose()}/>,
        document.body
        )
        : null

    if (renderType === nodeDefRenderType.tableBody) {
      return <div className="node-def__table-row-taxon node-def__table-data-composite-attr">
        {codeInputField}
        {scientificNameInputField}
        {vernacularNameInputField}

        {autocompleteDialog}
      </div>
    }

    return (
      <NodeDefFormItem label={label}>
        <div className="node-def__taxon-wrapper">
          <FormItem label="Code">
            {codeInputField}
          </FormItem>
          <FormItem label="Scientific Name">
            {scientificNameInputField}
          </FormItem>
          <FormItem label="Vernacular Name">
            {vernacularNameInputField}
          </FormItem>
        </div>

        {autocompleteDialog}
      </NodeDefFormItem>
    )
  }
}

const mapStateToProps = (state, props) => ({
  taxonomy: Survey.getTaxonomyByUUID(
    NodeDef.getNodeDefTaxonomyUUID(props.nodeDef)
  )(getSurvey(state))
})

export default connect(mapStateToProps)(NodeDefTaxon)