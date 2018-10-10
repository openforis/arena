import React from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import Autocomplete from '../../../../commonComponents/form/autocomplete'

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

const fields = {
  code: 'code',
  genus: 'genus',
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
    this.genusField = React.createRef()
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
      genus: this.genusField,
      scientificName: this.scientificNameField,
      vernacularName: this.vernacularNameField,
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.node !== prevProps.node)
      this.resetValue()
  }

  getTaxonNodeValue () {
    const {nodes} = this.props
    const node = nodes[0]

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
      dirty: true,
      autocompleteOpened: true,
      autocompleteTaxa: [],
      autocompleteInputField: this.getInputFields()[field]
    })

    this.loadTaxa(field, value)
  }

  onTaxonSelect ({index}) {
    const {nodeDef, nodes, updateNode} = this.props

    const node = nodes[0]

    const {autocompleteTaxa} = this.state

    const taxon = autocompleteTaxa[index]
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
    const {nodeDef, draft, edit} = this.props
    const {
      code,
      genus,
      scientificName,
      vernacularName,

      autocompleteOpened,
      autocompleteTaxa,
      autocompleteInputField,
    } = this.state

    return (
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="Code">
            <Input ref={this.codeField}
                   readOnly={edit}
                   value={code}
                   onChange={(e) => this.onInputFieldChange(fields.code, e.target.value)}/>
          </FormItem>
          <FormItem label="Genus">
            <Input ref={this.genus}
                   readOnly={edit}
                   value={genus}
                   onChange={(e) => this.onInputFieldChange(fields.genus, e.target.value)}/>
          </FormItem>
          <FormItem label="Scientific Name">
            <Input ref={this.scientificNameField}
                   readOnly={edit}
                   value={scientificName}
                   onChange={(e) => this.onInputFieldChange(fields.scientificName, e.target.value)}/>
          </FormItem>
          <FormItem label="Vernacular Name">
            <Input ref={this.vernacularNameField}
                   readOnly={edit}
                   value={vernacularName}
                   onChange={(e) => this.onInputFieldChange(fields.vernacularName, e.target.value)}/>
          </FormItem>
        </div>

        {
          autocompleteOpened ?
            ReactDOM.createPortal(
              <Autocomplete items={autocompleteTaxa}
                            itemRenderer={TaxonAutocompleteItemRenderer}
                            onItemSelect={e => this.onTaxonSelect(e)}
                            onClose={() => this.onAutocompleteClose()}
                            inputField={autocompleteInputField.current.inputElement}/>,
              document.body
            )
            : null
        }
      </NodeDefFormItem>
    )
  }
}

export default NodeDefTaxon