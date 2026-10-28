export default {
  title: 'Novidades no Arena',
  since: 'Desde a versão {{version}}',
  experimental: 'Experimental',
  dontShowAgain: 'Não mostrar novamente',
  slideCounter: '{{current}} de {{total}}',
  noItems: 'Não há novidades para mostrar.',
  items: {
    areaOfInterest: {
      title: 'Área de interesse: verificar se uma localização está dentro de uma área',
      description: `Em **Informações do inquérito → Mapa**, carregue um polígono em formato GeoJSON como **área de interesse** do inquérito.

A nova função de expressão \`geoDistanceToAOIBoundary(location)\` retorna a distância em metros entre uma localização e o limite da área: negativa dentro, positiva fora. Compare-a com a precisão do GPS (\`location.accuracy\`) para classificar as localizações como dentro, fora ou incertas, por exemplo em valores padrão de atributos só de leitura e em regras de validação com severidade *aviso*. Também funciona offline no **Arena Mobile**.

Obrigado à **ASSEDEV** (Association pour l’Assainissement, la Sauvegarde de l’Environnement et le Développement) pelo pedido.`,
    },
    mobilePreview: {
      title: 'Visualização do inquérito no Arena Mobile',
      description: `No designer de formulários, abra o menu ao lado do botão **Visualizar** e escolha **Visualizar (móvel)** para experimentar o inquérito em rascunho tal como aparece no **Arena Mobile**, num telefone ou tablet, na orientação retrato ou paisagem.

A visualização é executada no navegador: algumas funcionalidades de um dispositivo real (p. ex. mapas e câmara) não estão disponíveis.`,
    },
    requiredIf: {
      title: 'Atributos obrigatórios por condição',
      description: `No designer de formulários, na aba **Validações** de um atributo, escolha **Obrigatório quando a condição é atendida** e escreva a condição: o atributo será obrigatório somente quando a condição for verdadeira.

Durante a entrada de dados, o erro "Valor obrigatório" é exibido somente quando a condição é atendida.`,
    },
    themeSelector: {
      title: 'Tema claro e escuro',
      description: `Use o menu **Tema** no cabeçalho (também na página de login) para alternar entre o tema **Claro** e **Escuro**, ou seguir o **Padrão do sistema**.`,
    },
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
      description: `O **Painel** tem um novo visual: registros e colaboradores num relance, um mapa dos dados coletados e a tendência dos registros adicionados ao longo do tempo.`,
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
