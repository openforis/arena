import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import axios from 'axios'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../../commonComponents/form/input'
import AutocompleteDialog from '../../../../../commonComponents/form/autocompleteDialog'

import { toQueryString } from '../../../../../../server/serverUtils/request'

import Survey from '../../../../../../common/survey/survey'
import Taxon from '../../../../../../common/survey/taxonomy'
import NodeDef from '../../../../../../common/survey/nodeDef'
import Node from '../../../../../../common/record/node'

import { nodeDefRenderType } from '../../../../../../common/survey/nodeDefLayout'
import { getStateSurveyInfo, getSurvey } from '../../../../../survey/surveyState'

const fields = {
  code: 'code',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

const defaultFieldValues = {
  code: '',
  scientificName: '',
  vernacularName: ''
}

const TaxonAutocompleteItemRenderer = props => {
  const {item: taxon, ...otherProps} = props

  const vernacularNames = Taxon.getTaxonVernacularNames(taxon)
  const vernacularNamesString = R.pipe(
    R.keys, //vernacular language codes
    R.map(langCode => `${R.prop(langCode, vernacularNames)} (${langCode})`),
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

    this.state = {
      ...defaultFieldValues,
      dirty: false,
      autocompleteOpened: false,
      autocompleteTaxa: [],
      autocompleteInputField: null,
    }
  }

  async componentDidMount () {
    if (this.props.entry) {
      await this.loadSelectedTaxon()
    }
  }

  async componentDidUpdate (prevProps) {
    if (this.props.entry && !R.equals(prevProps.nodes, this.props.nodes)) {
      await this.loadSelectedTaxon()
    }
  }

  async loadSelectedTaxon () {
    const {nodes} = this.props
    const node = nodes[0]

    const taxon = node ? await this.loadTaxonByNode(node) : null

    if (taxon) {
      this.setState({
        code: Taxon.getTaxonCode(taxon),
        scientificName: Taxon.getTaxonScientificName(taxon),
        vernacularName: taxon.vernacularName,
      })
    }
  }

  async loadTaxonByNode (node) {
    let filterProp = null
    let filterPropValue = null

    const vernacularNameUuid = Node.getNodeVernacularNameUuid(node)

    if (vernacularNameUuid) {
      filterProp = 'vernacularNameUuid'
      filterPropValue = vernacularNameUuid
    } else {
      filterProp = 'uuid'
      filterPropValue = Node.getNodeTaxonUuid(node)
    }

    if (filterPropValue) {
      const taxa = await this.loadTaxa(filterProp, filterPropValue, true)
      return R.head(taxa)
    } else {
      return null
    }
  }

  getInputFields () {
    return {
      code: this.codeField,
      scientificName: this.scientificNameField,
      vernacularName: this.vernacularNameField,
    }
  }

  async onInputFieldChange (field, value) {
    //reset other fields values

    const fieldValues = R.assoc(field, value)(defaultFieldValues)

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
      await this.loadAutocompleteTaxa(field, value)
    }
  }

  onTaxonSelect (taxonSearchResult) {
    const value = {
      taxonUuid: taxonSearchResult.uuid
    }
    const nodeValue = taxonSearchResult.vernacularName
      ? R.assoc('vernacularNameUuid', R.prop('vernacularNameUuid', taxonSearchResult), value)
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

  async loadTaxa (field, value, strict = false) {
    const {surveyInfo, taxonomy} = this.props

    const searchValue =
      strict ? value
        : field === fields.code
        ? `${value}*` //starts with value
        : `*${value}*` //contains value

    const params = {
      draft: false,
      limit: 20,
      offset: 0,
      filter: {
        [field]: searchValue,
      }
    }

    const {data} = await axios.get(`/api/survey/${surveyInfo.id}/taxonomies/${taxonomy.id}/taxa?${toQueryString(params)}`)
    return data.taxa
  }

  async loadAutocompleteTaxa (field, value) {
    const taxa = await this.loadTaxa(field, value)
    this.setState({autocompleteTaxa: taxa})
  }

  render () {
    const {
      edit, renderType
    } = this.props

    const {
      code,
      scientificName,
      vernacularName,

      autocompleteOpened,
      autocompleteTaxa,
      autocompleteInputField,
    } = this.state

    const codeInputField = <Input ref={this.codeField}
                                  readOnly={edit}
                                  value={code}
                                  onChange={value => this.onInputFieldChange(fields.code, value)}/>

    const scientificNameInputField = <Input ref={this.scientificNameField}
                                            readOnly={edit}
                                            value={scientificName}
                                            onChange={value => this.onInputFieldChange(fields.scientificName, value)}/>

    const vernacularNameInputField = <Input ref={this.vernacularNameField}
                                            readOnly={edit}
                                            value={vernacularName}
                                            onChange={value => this.onInputFieldChange(fields.vernacularName, value)}/>

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

        {autocompleteDialog}
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  taxonomy: Survey.getTaxonomyByUuid(
    NodeDef.getNodeDefTaxonomyUuid(props.nodeDef)
  )(getSurvey(state)),
  surveyInfo: getStateSurveyInfo(state)
})

export default connect(mapStateToProps)(NodeDefTaxon)