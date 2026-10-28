export default {
  title: `What's new in Arena`,
  since: 'Since version {{version}}',
  experimental: 'Experimental',
  dontShowAgain: `Don't show these again`,
  slideCounter: '{{current}} of {{total}}',
  noItems: 'No new features to show.',
  items: {
    areaOfInterest: {
      title: 'Area of interest: check if a location is inside an area',
      description: `In **Survey info → Map**, upload a polygon in GeoJSON format as the survey **area of interest**.

The new expression function \`geoDistanceToAOIBoundary(location)\` returns the distance in meters between a location and the boundary of the area: negative inside, positive outside. Compare it with the GPS accuracy (\`location.accuracy\`) to classify locations as inside, outside or uncertain, e.g. in default values of read-only attributes and in validation rules with severity *warning*. It works offline in **Arena Mobile** too.

Thanks to **ASSEDEV – Alerte Environnement** for the request.`,
    },
    mobilePreview: {
      title: 'Preview the survey in Arena Mobile',
      description: `In the form designer, open the menu next to the **Preview** button and choose **Preview (mobile)** to try the draft survey as it looks in **Arena Mobile**, on a phone or a tablet, in portrait or landscape orientation.

The preview runs in the browser: some features of a real device (e.g. maps and camera) are not available.`,
    },
    requiredIf: {
      title: 'Conditionally required attributes',
      description: `In the form designer, in the **Validations** tab of an attribute, choose **Required when condition is met** and write the condition: the attribute is required only when the condition is true.

During data entry, the "Required value" error is shown only when the condition is met.`,
    },
    themeSelector: {
      title: 'Light and dark theme',
      description: `Use the **Theme** menu in the header (also in the login page) to switch between the **Light** and **Dark** theme, or follow your **System default**.`,
    },
    surveyCompare: {
      title: 'Compare and update surveys',
      description: `In the **Dashboard**, use **Advanced functions > Compare / update from file** to compare this survey with one exported from another Arena server (e.g. a test server) or with another survey on this server.

Review the differences and apply only the changes you select: they are saved as draft until you publish the survey.`,
    },
    usersBackup: {
      title: 'Backup and restore users',
      description: `In **Users**, use **Backup / Restore** to export all users, with their survey roles and user groups, and restore them into another Arena server.

Before restoring, you can choose what to do with every user.`,
    },
    samplingPointDataWhisp: {
      title: 'Whisp analysis of sampling points',
      description: `In the **sampling point data** category, use **Generate Whisp analysis** to analyze all the sampling point locations with **Open Foris Whisp**.

The analysis runs in the background and the results are saved in a new category.`,
    },
    dashboardUpgrade: {
      title: 'A new dashboard',
      description: `The **Dashboard** has a new look: records and contributors at a glance, a map of the collected data and the trend of the records added over time.`,
    },
    clearNonApplicableValues: {
      title: 'Non-relevant values are cleared',
      description: `During data entry, when a change makes other fields no longer relevant, their values are cleared, after asking you to confirm.

Survey admins can keep the old behavior with **Keep values of non-relevant attributes** (**Survey Info > Security**).`,
    },
    systemLogs: {
      title: 'System logs',
      description: `In **System Administration > System Logs**, follow the server logs live, with text and level filters.`,
    },
    dataQueryAiGenerate: {
      title: 'Create Data Explorer queries with AI',
      description: `In **Data Explorer**, describe the data you are looking for in plain language (e.g. *"number of trees by species in each province"*) and let AI build the query for you.

AI can also suggest a name and a description when you save a query.

*Requires AI features to be enabled in your user profile.*`,
    },
    recordPrint: {
      title: 'Print records',
      description: `Export a record as a printable **Word** or **PDF** document, pictures included, using the PDF button in the record editor.

You can choose the page orientation (portrait or landscape).`,
    },
    attributeClone: {
      title: 'Clone attributes in the form designer',
      description: `In the **form designer**, use the menu of an attribute to **clone** it into the same or another entity, with all its properties.`,
    },
    odkImport: {
      title: 'Import surveys and data from ODK',
      description: `Create a new survey from an **ODK form (.xml)** and import the data collected with **ODK Collect**.

*This feature is in beta.*`,
    },
    dynamicEnumerator: {
      title: 'Dynamic enumeration of entities',
      description: `Use an **expression** to choose which category items generate the rows of an enumerated multiple entity: e.g. \`unique(plot.land_use)\` creates a row only for the land uses actually found in the plots.`,
    },
  },
}
