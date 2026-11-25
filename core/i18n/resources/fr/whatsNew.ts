export default {
  title: 'Nouveautés dans Arena',
  since: 'Depuis la version {{version}}',
  experimental: 'Expérimental',
  dontShowAgain: 'Ne plus afficher',
  showChangelog: 'Toutes les modifications et corrections (journal des modifications)',
  slideCounter: '{{current}} sur {{total}}',
  noItems: 'Aucune nouveauté à afficher.',
  items: {
    googleSignIn: {
      title: 'Connexion avec votre compte Google',
      description: `Sur la page de connexion, cliquez sur **Se connecter avec Google** pour vous connecter avec votre compte Google (Gmail ou Google Workspace) au lieu de saisir votre mot de passe.

La première fois, le compte Google est associé à votre compte Arena par son adresse e-mail : utilisez la même adresse e-mail que celle de votre compte Arena. Les utilisateurs invités peuvent aussi accepter l'invitation avec Google. Associez ou dissociez votre compte Google dans **Mon profil > Méthodes de connexion** ; la connexion par e-mail et mot de passe reste disponible.`,
    },
    twoFactorAuth: {
      title: 'Authentification à deux facteurs',
      description: `Protégez votre compte avec l'**authentification à deux facteurs (2FA)** : après votre mot de passe, Arena demande un code de vérification généré par une application d'authentification sur votre téléphone (par ex. Google Authenticator ou Authy).

Dans **Mon profil > Connexion et sécurité**, cliquez sur **Gérer 2FA**, ajoutez un appareil et scannez le code QR avec l'application. Conservez les codes de sauvegarde affichés à la fin : chacun d'eux permet de vous connecter une fois si vous perdez votre téléphone.`,
    },
    aiFeatures: {
      title: 'Fonctionnalités IA',
      description: `Dans **Mon profil > Fonctionnalités IA**, choisissez **Ce que l'IA peut voir** :

- **Aide seulement** : vos questions et des extraits du manuel d'utilisation d'Arena ;
- **+ Conception du formulaire** : aussi les entités, attributs, étiquettes, catégories et expressions (aucune valeur des enregistrements) ;
- **+ Données des enregistrements** : aussi les valeurs des enregistrements et les résultats des requêtes.

Avec **Personnaliser**, vous activez ou désactivez chaque fonctionnalité. Dans **Fournisseurs**, utilisez le **Fournisseur par défaut d'Arena** ou ajoutez le vôtre : un **Serveur local** sur votre ordinateur ou votre réseau (par ex. LM Studio ou Ollama) ou un fournisseur cloud avec votre clé API (OpenAI, Anthropic, Google Gemini et d'autres).`,
    },
    aiAssistant: {
      title: 'Assistant IA',
      description: `Cliquez sur le bouton **Assistant IA** de l'en-tête pour ouvrir un panneau qui travaille sur l'écran que vous utilisez :

- **Conception** : crée et modifie le formulaire dans le concepteur de formulaires ;
- **Analyse** : répond aux questions sur les données à l'aide de requêtes ;
- **Nettoyage** : recherche les erreurs dans les enregistrements et propose des corrections ;
- **Aide** : répond aux questions sur Arena.

Les modifications proposées ne sont appliquées qu'après votre vérification. Des **suggestions** (par ex. des étiquettes manquantes dans une langue) apparaissent dans le panneau : cliquez sur l'une d'elles pour que l'assistant s'en charge.`,
    },
    surveyAiPolicy: {
      title: "Politique d'IA du formulaire",
      description: `Dans **Infos du formulaire > Politique d'IA**, les administrateurs du formulaire choisissent où l'IA peut traiter le contenu du formulaire, séparément pour la **Conception du formulaire** et les **Données des enregistrements** : **Désactivée**, **Sur cet appareil** (un serveur d'IA local), **Serveur de l'organisation** ou **Cloud**.

La plus stricte entre cette politique et les limites du serveur Arena s'applique à tous les utilisateurs du formulaire.`,
    },
    mobileUploadEmailNotification: {
      title: 'Notification par e-mail des enregistrements téléversés depuis Arena Mobile',
      description: `Dans **Infos de l'enquête → Sécurité**, cochez **Avertir les administrateurs de formulaire par e-mail lors du téléversement d'enregistrements depuis Arena Mobile** : après chaque téléversement, chaque administrateur de formulaire reçoit un e-mail avec la liste des enregistrements téléversés, leurs valeurs clés, s'ils sont nouveaux ou mis à jour, l'utilisateur qui les a créés, les dates et le nombre d'erreurs et d'avertissements de validation.

Un seul e-mail est envoyé par téléversement, même quand un appareil téléverse de nombreux enregistrements. L'option est disponible quand **Autoriser le téléversement des enregistrements depuis Arena Mobile vers le serveur** est cochée, et elle s'applique une fois l'enquête publiée.`,
    },
    surveyGuestRole: {
      title: 'Nouveau rôle : Invité, pour consulter les enregistrements sans les modifier',
      description: `Invitez des utilisateurs avec le nouveau rôle **Invité** (**Utilisateurs > Inviter un utilisateur**) : ils peuvent consulter tous les enregistrements de l'enquête, aussi dans **Arena Mobile**, mais ils ne peuvent ni les modifier, ni les supprimer, ni en ajouter de nouveaux.

Ajoutez l'invité à un **groupe d'utilisateurs** (**Utilisateurs > Groupes d'utilisateurs**) avec des qualificatifs pour n'afficher qu'une partie des données : les enregistrements dont les attributs qualificatifs correspondent aux valeurs du groupe (par ex. les placettes d'une région). Les groupes avec l'option **Peut consulter les enregistrements de** donnent aussi accès aux enregistrements d'autres groupes.

Les enquêtes existantes reçoivent automatiquement le nouveau rôle.`,
    },
    areaOfInterest: {
      title: "Zones d'intérêt : vérifier si un emplacement se trouve dans une zone",
      description: `Dans **Infos de l'enquête → Carte**, ajoutez une ou plusieurs **zones d'intérêt** (par ex. les communes d'une zone pilote), chacune avec un nom et un polygone au format GeoJSON. Visualisez-les sur une carte en les ajoutant, une par une ou toutes ensemble (**Tout afficher sur la carte**), et affichez-les comme couches dans **Données > Carte**.

La nouvelle fonction d'expression \`geoDistanceToAOIBoundary(location, 'area_name')\` renvoie la distance en mètres entre un emplacement et la limite de la zone : négative à l'intérieur, positive à l'extérieur. Comparez-la avec la précision GPS (\`location.accuracy\`) pour classer les emplacements comme à l'intérieur, à l'extérieur ou incertains, par exemple dans les valeurs par défaut d'attributs en lecture seule et dans des règles de validation de gravité *avertissement*. \`geoAOIContaining(location)\` renvoie le nom de la zone contenant l'emplacement. Les deux fonctionnent aussi hors ligne dans **Arena Mobile**.

Merci à **[ASSEDEV Alerte Environnement](https://assedev.fr)** pour la demande.`,
    },
    dataQueryTotals: {
      title: "Totaux et pourcentages dans l'Explorateur de données",
      description: `Dans **Données > Explorateur**, en mode **Agrégat** avec une seule mesure (p. ex. la somme du volume des arbres par espèce), ouvrez le menu **Affichage** et choisissez **Afficher le total et le pourcentage** : chaque ligne affiche son pourcentage du total et une ligne **Total** est ajoutée en bas du tableau.

Les options **Afficher les noms** et **Afficher les codes** se trouvent aussi dans le menu **Affichage**.`,
    },
    mapWorkspace: {
      title: `Un nouvel espace de travail cartographique`,
      description: `**Données > Carte** a une nouvelle disposition : en haut, les menus **Fond de carte**, **Ajouter des données**, **Affichage** et **Outils** et une zone de recherche de coordonnées et de clés d'enregistrements ; sur le côté, les onglets **Couches**, **Enregistrements** et **Légende** ; en bas, une barre d'état avec les coordonnées du pointeur et l'échelle.

Parcourez les enregistrements sur la carte, ajoutez vos propres fichiers (KML, Shapefile, GeoJSON) ou services WMS / WMTS, mesurez des distances et des surfaces et faites des captures d'écran.`,
    },
    dataMatrixExport: {
      title: `Exporter les données sous forme de matrice`,
      description: `Dans **Données > Explorateur**, sélectionnez une entité multiple (p. ex. les espèces de chaque enregistrement), cliquez sur **Exporter** et choisissez **Exporter en tant que : Matrice de données** pour obtenir un tableau avec une ligne par espèce (ou tout autre attribut) et une colonne par enregistrement, avec la valeur de votre choix dans les cellules (p. ex. le recouvrement).

C'est le format requis par les outils d'analyse de la végétation comme **Turboveg**, **Juice** et **Synbiosys**. Définissez un filtre dans l'Explorateur pour n'exporter que certains enregistrements.`,
    },
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
      title: 'Importer des formulaires et des données depuis ODK',
      description: `Créez un nouveau formulaire à partir d'un **formulaire ODK** (XForm, .xml) : dans **Accueil > Nouveau formulaire > Importer**, sélectionnez **ODK (.xml)** comme **Source**, puis cliquez sur **Démarrer l'importation**. Les questions du formulaire deviennent des attributs, les répétitions (repeats) des entités multiples et les listes de choix des catégories, avec les étiquettes dans toutes les langues du formulaire. Avant de publier, définissez les attributs clés de l'entité racine et corrigez les éventuelles erreurs signalées par **Publier**.

Importez ensuite les données collectées avec **ODK Collect** dans **Données > Importation de données > ODK / ODK Collect** : un fichier .zip avec un dossier par soumission (export ODK Briefcase). Les soumissions déjà importées sont ignorées.`,
    },
    positionTracking: {
      title: 'Suivi de la position : enregistrer le trajet parcouru sur le terrain',
      description: `Cochez **Suivi de la position** dans l'onglet **Basique** d'un attribut **Géospatial** simple : dans **Arena Mobile**, la valeur de l'attribut est le trajet parcouru par l'utilisateur pendant la saisie de l'enregistrement, enregistré en suivant la position de l'appareil.

Le trajet ne peut pas être modifié manuellement. L'option s'applique uniquement à Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Énumération dynamique des entités',
      description: `Utilisez une **expression** pour choisir les éléments de catégorie qui génèrent les lignes d'une entité multiple énumérée : par ex. \`unique(plot.land_use)\` crée une ligne uniquement pour les utilisations des terres présentes dans les parcelles.`,
    },
  },
}
