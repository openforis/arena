import React from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import AutocompleteDialog from '../../../../commonComponents/form/autocompleteDialog'

import { toQueryString } from '../../../../../server/serverUtils/request'
import {
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName
} from '../../../../../common/survey/taxonomy'
import {
  getTaxonomyUUID,
} from '../../../../../common/survey/nodeDef'
import {
  getSurveyTaxonomyByUUID,
} from '../../../../../common/survey/survey'
import {
  getNodeValue,
} from '../../../../../common/record/node'
import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

const fields = {
  code: 'code',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

const AUTOCOMPLETE_ROWS = 20

const TaxonAutocompleteItemRenderer = props => {
  const {item: taxon, ...otherProps} = props

  return <div {...otherProps}
              key={taxon.uuid}
              className="item"
              tabIndex="1">
    <div>{getTaxonCode(taxon)}</div>
    <div>{getTaxonScientificName(taxon)}</div>
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

  componentDidUpdate (prevProps) {
    if (this.props.node !== prevProps.node)
      this.resetValue()
  }

  getTaxonNodeValue () {
    const {edit, nodes} = this.props
    const node = edit ? null : nodes[0]

    return getNodeValue(node, {
      code: '',
      family: '',
      genus: '',
      scientificName: '',
      vernacularName: '',
    })
  }

  resetValue () {
    this.onValueChange(this.getTaxonNodeValue())
  }

  onInputFieldChange (field, value) {
    this.setState({
      [field]: value,
      dirty: true,
      autocompleteOpened: true,
      autocompleteTaxa: [],
      autocompleteInputField: this.getInputFields()[field]
    })

    this.loadTaxa(field, value)
  }

  onTaxonSelect ({item: taxon}) {
    const {nodeDef, nodes, updateNode} = this.props

    const node = nodes[0]

    const value = {
      code: getTaxonCode(taxon),
      family: getTaxonFamily(taxon),
      genus: getTaxonGenus(taxon),
      scientificName: getTaxonScientificName(taxon),
    }
    this.onValueChange(value)

    updateNode(nodeDef, node, value)
  }

  onAutocompleteClose () {
    this.resetValue()
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

  loadTaxa (field, value) {
    const {survey, nodeDef} = this.props

    const taxonomy = getSurveyTaxonomyByUUID(getTaxonomyUUID(nodeDef))(survey)

    const params = {
      draft: false,
      limit: AUTOCOMPLETE_ROWS,
      offset: 0,
      filter: {
        [field]: value,
      }
    }

    axios.get(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/taxa?${toQueryString(params)}`)
      .then(res => {
        const {taxa} = res.data

        this.setState({
          autocompleteTaxa: taxa
        })
      })
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
        <AutocompleteDialog items={autocompleteTaxa}
                            itemRenderer={TaxonAutocompleteItemRenderer}
                            onItemSelect={e => this.onTaxonSelect(e)}
                            onClose={() => this.onAutocompleteClose()}
                            className="node-def__taxon-autocomplete-list"
                            inputField={autocompleteInputField.current.inputElement}
                            alignToElement={
                              (renderType === nodeDefRenderType.tableBody
                                  ? this.getInputFields().code
                                  : autocompleteInputField
                              ).current.inputElement}/>,
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
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
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

export default NodeDefTaxon