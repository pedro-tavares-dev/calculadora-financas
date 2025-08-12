Calculadora de Despesas React
Calculadora simples e funcional para controle financeiro pessoal ou profissional, construída com React.
Permite inserir despesas diárias classificadas por categoria, priorizar gastos, visualizar um calendário interativo, gerar gráficos de pizza e exportar relatórios mensais em Excel.

Funcionalidades
Calendário mensal interativo para seleção do dia

Adição de despesas com campos:

Classificação (categoria pré-definida)

Valor (formatado em moeda BRL)

Prioridade (Baixa, Normal, Alta)

Visualização gráfica da distribuição de gastos por categoria (gráfico de pizza)

Exportação do relatório mensal em arquivo Excel (.xlsx) com:

Aba 1: Detalhes das despesas diárias

Aba 2: Resumo por categoria

Design responsivo e limpo com Tailwind CSS

Tecnologias utilizadas
React.js

Tailwind CSS

date-fns (manipulação de datas)

Recharts (gráfico de pizza)

xlsx e file-saver (geração e download de Excel)

Como rodar localmente
Clone o repositório:

bash
Copiar
Editar
git clone https://github.com/seu-usuario/seu-repositorio.git
Acesse a pasta do projeto:

bash
Copiar
Editar
cd seu-repositorio
Instale as dependências:

bash
Copiar
Editar
npm install
Inicie o servidor de desenvolvimento:

bash
Copiar
Editar
npm start
Como fazer o deploy no GitHub Pages
Instale o pacote gh-pages (se ainda não instalou):

bash
Copiar
Editar
npm install --save-dev gh-pages
No package.json, configure a propriedade "homepage":

json
Copiar
Editar
"homepage": "https://SEU_USUARIO.github.io/SEU_REPOSITORIO"
No package.json, adicione os scripts:

json
Copiar
Editar
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
Rode o deploy:

bash
Copiar
Editar
npm run deploy
Configure o GitHub Pages na aba Settings > Pages para usar a branch gh-pages.

Personalização
Categorias: Edite o array categorias em src/App.jsx para alterar as opções do formulário.

Cores do gráfico: Edite o array COLORS para personalizar as cores do gráfico de pizza.

Formato de moeda: A função formatarMoeda pode ser adaptada para outras moedas ou formatos.

Contato
Criado por Sr Pedro — GitHub | LinkedIn
Email: joaopedrotavarres@gmail.com
