export default {
  title: 'Nouveautés dans Arena',
  since: 'Depuis la version {{version}}',
  experimental: 'Expérimental',
  dontShowAgain: 'Ne plus afficher',
  slideCounter: '{{current}} sur {{total}}',
  noItems: 'Aucune nouveauté à afficher.',
  items: {
    mobilePreview: {
      title: "Aperçu de l'enquête dans Arena Mobile",
      description: `Dans le concepteur de formulaires, ouvrez le menu à côté du bouton **Aperçu** et choisissez **Aperçu (mobile)** pour essayer l'enquête en brouillon telle qu'elle apparaît dans **Arena Mobile**, sur un téléphone ou une tablette, en orientation portrait ou paysage.

L'aperçu s'exécute dans le navigateur : certaines fonctionnalités d'un appareil réel (par ex. cartes et appareil photo) ne sont pas disponibles.`,
    },
    requiredIf: {
      title: 'Attributs obligatoires sous condition',
      description: `Dans le concepteur de formulaires, dans l'onglet **Validations** d'un attribut, choisissez **Obligatoire lorsque la condition est remplie** et saisissez la condition : l'attribut n'est obligatoire que lorsque la condition est vraie.

Lors de la saisie des données, l'erreur « Valeur requise » n'est affichée que lorsque la condition est remplie.`,
    },
    themeSelector: {
      title: 'Thème clair et sombre',
      description: `Utilisez le menu **Thème** de l'en-tête (également sur la page de connexion) pour passer du thème **Clair** au thème **Sombre**, ou suivre le thème **Par défaut du système**.`,
    },
    surveyCompare: {
      title: 'Comparer et mettre à jour les formulaires',
      description: `Dans le **Tableau de bord**, utilisez **Fonctions avancées > Comparer / mettre à jour depuis un fichier** pour comparer ce formulaire avec un formulaire exporté depuis un autre serveur Arena (par ex. un serveur de test) ou avec un autre formulaire de ce serveur.

Examinez les différences et appliquez uniquement les modifications sélectionnées : elles restent en brouillon jusqu'à la publication du formulaire.`,
    },
    usersBackup: {
      title: 'Sauvegarder et restaurer les utilisateurs',
      description: `Dans **Utilisateurs**, utilisez **Sauvegarde / Restauration** pour exporter tous les utilisateurs, avec leurs rôles dans les formulaires et leurs groupes d'utilisateurs, et les restaurer dans un autre serveur Arena.

Avant la restauration, vous pouvez choisir quoi faire pour chaque utilisateur.`,
    },
    samplingPointDataWhisp: {
      title: "Analyse Whisp des points d'échantillonnage",
      description: `Dans la catégorie **données de points d'échantillonnage**, utilisez **Générer l'analyse Whisp** pour analyser toutes les positions des points d'échantillonnage avec **Open Foris Whisp**.

L'analyse s'exécute en arrière-plan et les résultats sont enregistrés dans une nouvelle catégorie.`,
    },
    dashboardUpgrade: {
      title: 'Un nouveau tableau de bord',
      description: `Le **Tableau de bord** fait peau neuve : enregistrements et contributeurs en un coup d'œil, une carte des données collectées et l'évolution des enregistrements ajoutés dans le temps.`,
    },
    clearNonApplicableValues: {
      title: 'Les valeurs non pertinentes sont effacées',
      description: `Lors de la saisie, quand une modification rend d'autres champs non pertinents, leurs valeurs sont effacées, après votre confirmation.

Les administrateurs du formulaire peuvent conserver l'ancien comportement avec **Conserver les valeurs des attributs non pertinents** (**Infos du formulaire > Sécurité**).`,
    },
    systemLogs: {
      title: 'Journaux système',
      description: `Dans **Administration du système > Journaux système**, suivez en direct les journaux du serveur, avec des filtres par texte et par niveau.`,
    },
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
