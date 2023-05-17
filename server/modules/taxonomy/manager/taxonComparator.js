import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'

const prepareTaxonPropsToCompare = A.omit(['index'])

const prepareTaxonToCompare = (taxon) =>
  A.pipe(
    A.omit([ObjectUtils.keys.id, ObjectUtils.keys.draft, ObjectUtils.keys.published, Validation.keys.validation]),
    (taxonUpdated) =>
      A.assoc(ObjectUtils.keys.props, prepareTaxonPropsToCompare(Taxon.getProps(taxonUpdated)))(taxonUpdated),
    (taxonUpdated) => {
      const vernacularNamesArray = Object.values(Taxon.getVernacularNames(taxonUpdated)).flat()
      if (vernacularNamesArray.length === 0) return taxonUpdated

      const vernacularNamesArrayUpdated = vernacularNamesArray
        // sort by lang and name
        .sort((vn1, vn2) => {
          const langCompare = TaxonVernacularName.getLang(vn1).localeCompare(TaxonVernacularName.getLang(vn2))
          if (langCompare !== 0) return langCompare
          return TaxonVernacularName.getName(vn1).localeCompare(TaxonVernacularName.getName(vn2))
        })
        // omit uuid
        .map(A.omit([ObjectUtils.keys.uuid]))

      const vernacularNamesUpdated = vernacularNamesArrayUpdated.reduce((acc, vernacularName) => {
        const lang = TaxonVernacularName.getLang(vernacularName)
        let vernacularNamesWithSameLang = acc[lang]
        if (!vernacularNamesWithSameLang) {
          vernacularNamesWithSameLang = []
          acc[lang] = vernacularNamesWithSameLang
        }
        vernacularNamesWithSameLang.push(vernacularName)
        return acc
      }, {})
      return Taxon.assocVernacularNamesByLang(vernacularNamesUpdated)(taxonUpdated)
    }
  )(taxon)

const isTaxonEqual = (taxonA) => (taxonB) =>
  Objects.isEqual(prepareTaxonToCompare(taxonA), prepareTaxonToCompare(taxonB))

export const TaxonComparator = {
  isTaxonEqual,
}
