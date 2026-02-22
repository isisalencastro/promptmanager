# Prompt Manager

Aplicação web simples para criar, organizar, buscar e reutilizar prompts diretamente no navegador.

## Visão geral

O **Prompt Manager** é uma aplicação front-end (HTML, CSS e JavaScript puro) para gerenciamento local de prompts.
Os dados ficam salvos no `localStorage`, então você pode fechar e abrir o navegador sem perder seus prompts no mesmo dispositivo/perfil.

## Funcionalidades

- ✅ Criar novo prompt.
- ✅ Editar título e conteúdo de um prompt existente.
- ✅ Salvar prompts no navegador (`localStorage`).
- ✅ Buscar prompts por título na barra lateral.
- ✅ Selecionar um prompt da lista para visualizar/editar.
- ✅ Remover prompt da lista.
- ✅ Copiar conteúdo do prompt para a área de transferência.
- ✅ Atalho de teclado para salvar (`Ctrl + Enter` ou `Cmd + Enter`).
- ✅ Abrir/fechar menu lateral.

## Estrutura do projeto

```text
promptmanager/
├── index.html         # Estrutura principal da interface
├── scripts.js         # Lógica da aplicação
├── css/
│   └── style.css      # Estilos da aplicação
├── assets/            # Ícones e logotipo
└── README.md          # Documentação
```

## Como executar o projeto

Como é um projeto estático, você pode executar de duas formas:

### Opção 1: abrir direto no navegador

1. Abra o arquivo `index.html` no seu navegador.

> Observação: algumas funcionalidades podem funcionar melhor quando servidas por um servidor local.

### Opção 2: servidor local (recomendado)

No diretório do projeto, execute:

```bash
python3 -m http.server 8000
```

Depois acesse no navegador:

```text
http://localhost:8000
```

## Fluxo de uso

1. Clique em **+ Novo prompt**.
2. Digite o **título** e o **conteúdo**.
3. Clique em **Salvar**.
4. Use a barra de busca para encontrar prompts pelo título.
5. Clique em um item da lista para carregar e editar.
6. Clique no ícone de lixeira para remover.
7. Clique em **Copiar** para enviar o conteúdo para a área de transferência.

## Regras de validação

- O sistema exige **título** e **conteúdo** para salvar.
- Se um prompt estiver selecionado, o botão **Salvar** atualiza esse prompt.
- Se não houver prompt selecionado, o sistema cria um novo item.

## Persistência de dados

- A aplicação utiliza `localStorage` com a chave:
  - `prompts_storage`
- Os prompts são armazenados localmente no navegador em formato JSON.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- API do navegador:
  - `localStorage`
  - `navigator.clipboard`

## Limitações atuais

- Não há autenticação/conta na nuvem.
- Os dados não são sincronizados entre dispositivos.
- A exportação/importação de prompts ainda não está implementada.

## Sugestões de evolução

- Adicionar categorias/tags para prompts.
- Implementar exportação/importação em JSON.
- Incluir confirmação visual de “prompt salvo” e “conteúdo copiado”.
- Criar modo escuro e melhorias de acessibilidade.
- Disponibilizar versão com backend para sincronização.

## Licença

Defina aqui a licença do projeto (ex.: MIT) caso deseje distribuição aberta.
