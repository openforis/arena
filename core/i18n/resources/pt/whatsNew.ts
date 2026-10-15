export default {
  title: 'Novidades no Arena',
  since: 'Desde a versão {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'Não mostrar novamente',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'Não há novidades para mostrar.',
  items: {
    surveyCompare: {
      title: 'Comparar e atualizar inventários',
      description: `No **Painel**, use **Funções avançadas > Comparar / atualizar a partir de arquivo** para comparar este inventário com um exportado de outro servidor Arena (p. ex. um servidor de testes) ou com outro inventário deste servidor.

Revise as diferenças e aplique apenas as alterações selecionadas: elas ficam salvas como rascunho até a publicação do inventário.`,
    },
    usersBackup: {
      title: 'Backup e restauração de usuários',
      description: `Em **Usuários**, use **Backup / Restaurar** para exportar todos os usuários, com seus papéis nos inventários e grupos de usuários, e restaurá-los em outro servidor Arena.

Antes de restaurar, você pode escolher o que fazer com cada usuário.`,
    },
    samplingPointDataWhisp: {
      title: 'Análise Whisp dos pontos amostrais',
      description: `Na categoria de **Dados de Ponto Amostral**, use **Gerar análise Whisp** para analisar todas as localizações dos pontos amostrais com o **Open Foris Whisp**.

A análise é executada em segundo plano e os resultados são salvos em uma nova categoria.`,
    },
    dashboardUpgrade: {
      title: 'Um novo painel',
      description: `O **Painel** tem um novo visual: registros, colaboradores e armazenamento num relance, um mapa dos dados coletados e a tendência dos registros adicionados ao longo do tempo.`,
    },
    clearNonApplicableValues: {
      title: 'Valores não relevantes são apagados',
      description: `Durante a entrada de dados, quando uma alteração torna outros campos não relevantes, seus valores são apagados, após a sua confirmação.

Os administradores do inventário podem manter o comportamento anterior com **Manter os valores dos atributos não relevantes** (**Informações do inventário > Segurança**).`,
    },
    systemLogs: {
      title: 'Registos do sistema',
      description: `Em **Administração do sistema > Registos do sistema**, acompanhe em tempo real os registos do servidor, com filtros por texto e nível.`,
    },
    dataQueryAiGenerate: {
      title: 'Crie consultas do Explorador de dados com IA',
      description: `No **Explorador de dados**, descreva em linguagem simples os dados que procura (p. ex. *"número de árvores por espécie em cada província"*) e deixe a IA construir a consulta por si.

A IA também pode sugerir um nome e uma descrição ao guardar uma consulta.

*Requer que as funcionalidades de IA estejam ativadas no seu perfil de utilizador.*`,
    },
    recordPrint: {
      title: 'Imprimir registos',
      description: `Exporte um registo como documento **Word** ou **PDF** imprimível, incluindo imagens, com o botão PDF do editor de registos.

Pode escolher a orientação da página (vertical ou horizontal).`,
    },
    attributeClone: {
      title: 'Clonar atributos no designer de formulários',
      description: `No **designer de formulários**, use o menu de um atributo para o **clonar** na mesma entidade ou noutra, com todas as suas propriedades.`,
    },
    odkImport: {
      title: 'Importar inquéritos e dados do ODK',
      description: `Crie um novo inquérito a partir de um **formulário ODK (.xml)** e importe os dados recolhidos com o **ODK Collect**.

*Esta funcionalidade está em fase beta.*`,
    },
    dynamicEnumerator: {
      title: 'Enumeração dinâmica de entidades',
      description: `Use uma **expressão** para escolher que itens da categoria geram as linhas de uma entidade múltipla enumerada: p. ex. \`unique(plot.land_use)\` cria uma linha apenas para os usos do solo presentes nas parcelas.`,
    },
  },
}
