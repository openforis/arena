export default {
  title: 'Novedades en Arena',
  since: 'Desde la versión {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'No volver a mostrar',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'No hay novedades para mostrar.',
  items: {
    areaOfInterest: {
      title: 'Áreas de interés: comprobar si una ubicación está dentro de un área',
      description: `En **Información de la encuesta → Mapa**, agregue una o más **áreas de interés** (p. ej. los municipios de un área piloto), cada una con un nombre y un polígono en formato GeoJSON.

La nueva función de expresión \`geoDistanceToAOIBoundary(location, 'area_name')\` devuelve la distancia en metros entre una ubicación y el límite del área: negativa dentro, positiva fuera. Compárela con la precisión GPS (\`location.accuracy\`) para clasificar las ubicaciones como dentro, fuera o inciertas, por ejemplo en valores por defecto de atributos de solo lectura y en reglas de validación con severidad *advertencia*. \`geoAOIContaining(location)\` devuelve el nombre del área que contiene la ubicación. Ambas funcionan también sin conexión en **Arena Mobile**.

Gracias a **[ASSEDEV](https://www.assedev.fr/)** (Association pour l’Assainissement, la Sauvegarde de l’Environnement et le Développement) por la solicitud.`,
    },
    mobilePreview: {
      title: 'Vista previa de la encuesta en Arena Mobile',
      description: `En el diseñador de formularios, abre el menú junto al botón **Vista previa** y elige **Vista previa (móvil)** para probar la encuesta en borrador tal como se ve en **Arena Mobile**, en un teléfono o una tableta, en orientación vertical u horizontal.

La vista previa se ejecuta en el navegador: algunas funciones de un dispositivo real (p. ej. mapas y cámara) no están disponibles.`,
    },
    requiredIf: {
      title: 'Atributos obligatorios según una condición',
      description: `En el diseñador de formularios, en la pestaña **Validaciones** de un atributo, elige **Obligatorio cuando se cumple la condición** y escribe la condición: el atributo será obligatorio solo cuando la condición sea verdadera.

Durante la entrada de datos, el error "Valor requerido" se muestra solo cuando se cumple la condición.`,
    },
    themeSelector: {
      title: 'Tema claro y oscuro',
      description: `Usa el menú **Tema** del encabezado (también en la página de inicio de sesión) para cambiar entre el tema **Claro** y **Oscuro**, o seguir el **Predeterminado del sistema**.`,
    },
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
      description: `El **Panel de control** tiene un nuevo aspecto: registros y colaboradores de un vistazo, un mapa de los datos recogidos y la tendencia de los registros añadidos en el tiempo.`,
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
