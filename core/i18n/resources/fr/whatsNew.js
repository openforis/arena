export default {
  title: 'Nouveautés dans Arena',
  since: 'Depuis la version {{version}}',
  experimental: 'Expérimental',
  dontShowAgain: 'Ne plus afficher',
  slideCounter: '{{current}} sur {{total}}',
  noItems: 'Aucune nouveauté à afficher.',
  items: {
    dataQueryAiGenerate: {
      title: `Créez des requêtes de l'Explorateur de données avec l'IA`,
      description: `Dans l'**Explorateur de données**, décrivez en langage courant les données recherchées (par ex. *« nombre d'arbres par espèce dans chaque province »*) et laissez l'IA construire la requête pour vous.

L'IA peut aussi suggérer un nom et une description lors de l'enregistrement d'une requête.

*Nécessite l'activation des fonctionnalités d'IA dans votre profil utilisateur.*`,
    },
    recordPrint: {
      title: 'Imprimer les enregistrements',
      description: `Exportez un enregistrement en document **Word** ou **PDF** imprimable, images comprises, avec le bouton PDF de l'éditeur d'enregistrement.

Vous pouvez choisir l'orientation de la page (portrait ou paysage).`,
    },
    attributeClone: {
      title: 'Cloner des attributs dans le concepteur de formulaires',
      description: `Dans le **concepteur de formulaires**, utilisez le menu d'un attribut pour le **cloner** dans la même entité ou dans une autre, avec toutes ses propriétés.`,
    },
    odkImport: {
      title: 'Importer des enquêtes et des données depuis ODK',
      description: `Créez une nouvelle enquête à partir d'un **formulaire ODK (.xml)** et importez les données collectées avec **ODK Collect**.

*Cette fonctionnalité est en version bêta.*`,
    },
    dynamicEnumerator: {
      title: 'Énumération dynamique des entités',
      description: `Utilisez une **expression** pour choisir les éléments de catégorie qui génèrent les lignes d'une entité multiple énumérée : par ex. \`unique(plot.land_use)\` crée une ligne uniquement pour les utilisations des terres présentes dans les parcelles.`,
    },
  },
}
