export default {
  buttonLabel_one: 'Assistant IA : {{count}} suggestion',
  buttonLabel_other: 'Assistant IA : {{count}} suggestions',
  listLabel: 'Suggestions',
  doIt: 'Faire',
  dismiss: 'Ignorer',
  moduleIntro: {
    card: {
      designer: 'Nouveau dans le concepteur de formulaires ? Demandez-moi comment il fonctionne.',
      data: 'Nouveau dans le module Données ? Demandez-moi comment il fonctionne.',
      analysis: 'Nouveau dans le module Analyse ? Demandez-moi comment il fonctionne.',
    },
    request: {
      designer: 'Comment fonctionne le concepteur de formulaires ?',
      data: 'Comment fonctionne le module Données ?',
      analysis: 'Comment fonctionne le module Analyse ?',
    },
  },
  missingTranslations: {
    card_one: '{{count}} texte manque en {{language}}. Le traduire ?',
    card_other: '{{count}} textes manquent en {{language}}. Les traduire ?',
    request_one: 'Traduisez {{count}} texte manquant en {{language}}.',
    request_other: 'Traduisez les {{count}} textes manquants en {{language}}.',
  },
  newEntriesDescriptions: {
    card_one: 'Vous avez ajouté {{count}} entrée sans description. Écrire les descriptions dans toutes les langues ?',
    card_other:
      'Vous avez ajouté {{count}} entrées sans description. Écrire les descriptions dans toutes les langues ?',
    request_one: 'Écrivez les descriptions dans toutes les langues pour {{count}} nouvelle entrée.',
    request_other: 'Écrivez les descriptions dans toutes les langues pour les {{count}} nouvelles entrées.',
  },
  entityWithoutKey: {
    cardSingle: "{{name}} n'a pas d'attribut clé. En suggérer un ?",
    card_one: "{{count}} entité n'a pas d'attribut clé. Suggérer des clés ?",
    card_other: "{{count}} entités n'ont pas d'attribut clé. Suggérer des clés ?",
    requestSingle: 'Suggérez un attribut clé pour {{name}}.',
    request_one: 'Suggérez un attribut clé pour {{count}} entité.',
    request_other: 'Suggérez des attributs clés pour {{count}} entités.',
  },
  attributeWithoutRef: {
    cardCategory: "{{name}} n'a pas de catégorie. En choisir une ?",
    cardTaxonomy: "{{name}} n'a pas de taxonomie. En choisir une ?",
    card_one: "{{count}} attribut n'a ni catégorie ni taxonomie. La choisir ?",
    card_other: "{{count}} attributs n'ont ni catégorie ni taxonomie. Les choisir ?",
    requestCategory: 'Choisissez une catégorie pour {{name}}.',
    requestTaxonomy: 'Choisissez une taxonomie pour {{name}}.',
    request_one: 'Choisissez une catégorie ou une taxonomie pour {{count}} attribut.',
    request_other: 'Choisissez des catégories ou des taxonomies pour {{count}} attributs.',
  },
  publishErrors: {
    card_one: '{{count}} entrée a des erreurs. La publication échouera. La corriger ?',
    card_other: '{{count}} entrées ont des erreurs. La publication échouera. Les corriger ?',
    request_one: 'Corrigez les erreurs de {{count}} entrée avant la publication.',
    request_other: 'Corrigez les erreurs de {{count}} entrées avant la publication.',
  },
  categoryItemTranslations: {
    card_one: '{{count}} libellé de catégorie manque en {{language}}. Le traduire ?',
    card_other: '{{count}} libellés de catégories manquent en {{language}}. Les traduire ?',
    request_one: 'Traduisez {{count}} libellé de catégorie manquant en {{language}}.',
    request_other: 'Traduisez les {{count}} libellés de catégories manquants en {{language}}.',
  },
  validationErrors: {
    card: '{{count}} messages de validation dans ce cycle. Résumer les tendances ?',
    request: 'Résumez les tendances des {{count}} messages de validation de ce cycle.',
  },
  dataImported: {
    card: '{{count}} enregistrements importés. Voir un aperçu rapide ?',
    cardOne: '1 enregistrement importé. Voir un aperçu rapide ?',
    request: 'Donnez-moi un aperçu rapide des {{count}} enregistrements importés.',
    requestOne: "Donnez-moi un aperçu rapide de l'enregistrement importé.",
  },
}
