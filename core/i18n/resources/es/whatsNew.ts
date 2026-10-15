export default {
  title: 'Novedades en Arena',
  since: 'Desde la versión {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'No volver a mostrar',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'No hay novedades para mostrar.',
  items: {
    surveyCompare: {
      title: 'Comparar y actualizar encuestas',
      description: `En el **Panel de control**, usa **Funciones avanzadas > Comparar / actualizar desde archivo** para comparar esta encuesta con una exportada desde otro servidor Arena (p. ej. un servidor de pruebas) o con otra encuesta de este servidor.

Revisa las diferencias y aplica solo los cambios que selecciones: se guardan como borrador hasta que publiques la encuesta.`,
    },
    usersBackup: {
      title: 'Copia de seguridad y restauración de usuarios',
      description: `En **Usuarios**, usa **Copia de seguridad / Restaurar** para exportar todos los usuarios, con sus roles en las encuestas y grupos de usuarios, y restaurarlos en otro servidor Arena.

Antes de restaurar, puedes elegir qué hacer con cada usuario.`,
    },
    samplingPointDataWhisp: {
      title: 'Análisis Whisp de los puntos de muestreo',
      description: `En la categoría de **datos de puntos de muestreo**, usa **Generar análisis Whisp** para analizar todas las ubicaciones de los puntos de muestreo con **Open Foris Whisp**.

El análisis se ejecuta en segundo plano y los resultados se guardan en una nueva categoría.`,
    },
    dashboardUpgrade: {
      title: 'Un nuevo panel de control',
      description: `El **Panel de control** tiene un nuevo aspecto: registros, colaboradores y almacenamiento de un vistazo, un mapa de los datos recogidos y la tendencia de los registros añadidos en el tiempo.`,
    },
    clearNonApplicableValues: {
      title: 'Se borran los valores no relevantes',
      description: `Durante la entrada de datos, cuando un cambio hace que otros campos dejen de ser relevantes, sus valores se borran, tras pedirte confirmación.

Los administradores de la encuesta pueden mantener el comportamiento anterior con **Conservar los valores de los atributos no relevantes** (**Información de la encuesta > Seguridad**).`,
    },
    systemLogs: {
      title: 'Registros del sistema',
      description: `En **Administración del sistema > Registros del sistema**, sigue en directo los registros del servidor, con filtros por texto y nivel.`,
    },
    dataQueryAiGenerate: {
      title: 'Crea consultas del Explorador de datos con IA',
      description: `En el **Explorador de datos**, describe en lenguaje natural los datos que buscas (p. ej. *"número de árboles por especie en cada provincia"*) y deja que la IA construya la consulta por ti.

La IA también puede sugerir un nombre y una descripción al guardar una consulta.

*Requiere que las funciones de IA estén habilitadas en tu perfil de usuario.*`,
    },
    recordPrint: {
      title: 'Imprimir registros',
      description: `Exporta un registro como documento **Word** o **PDF** imprimible, incluidas las imágenes, con el botón PDF del editor de registros.

Puedes elegir la orientación de la página (vertical u horizontal).`,
    },
    attributeClone: {
      title: 'Clonar atributos en el diseñador de formularios',
      description: `En el **diseñador de formularios**, usa el menú de un atributo para **clonarlo** en la misma entidad o en otra, con todas sus propiedades.`,
    },
    odkImport: {
      title: 'Importar encuestas y datos desde ODK',
      description: `Crea una nueva encuesta a partir de un **formulario ODK (.xml)** e importa los datos recogidos con **ODK Collect**.

*Esta función está en fase beta.*`,
    },
    dynamicEnumerator: {
      title: 'Enumeración dinámica de entidades',
      description: `Usa una **expresión** para elegir qué elementos de la categoría generan las filas de una entidad múltiple enumerada: p. ej. \`unique(plot.land_use)\` crea una fila solo para los usos del suelo presentes en las parcelas.`,
    },
  },
}
