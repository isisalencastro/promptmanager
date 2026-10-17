# Prompt Manager

Aplicação web simples para criar, organizar, buscar e reutilizar prompts diretamente no navegador.

## Visão geral

O **Prompt Manager** é uma aplicação front-end (HTML, CSS e JavaScript puro) para gerenciamento local de prompts.
Os dados ficam salvos no `localStorage`, então você pode fechar e abrir o navegador sem perder seus prompts no mesmo dispositivo/perfil.

## Funcionalidades

- ✅ Criar, editar, duplicar e remover prompts (com **Desfazer** ao remover).
- ✅ **Tags** por prompt e filtro por tag na barra lateral.
- ✅ **Favoritos** (★) e ordenação: mais recentes, A–Z ou favoritos primeiro.
- ✅ Busca por título, conteúdo e tags.
- ✅ **Variáveis** no formato `{{nome}}`: ao copiar, um formulário pede os valores e o texto sai preenchido.
- ✅ Copiar para a área de transferência com confirmação visual.
- ✅ **Exportar e importar** todos os prompts em JSON (backup e troca de dispositivo).
- ✅ Indicador de alterações não salvas, aviso ao sair sem salvar e contador de palavras, caracteres e tokens estimados.
- ✅ Prévia do conteúdo, tags e data em cada item da lista.
- ✅ Atalhos: `Ctrl/Cmd + S` ou `Ctrl/Cmd + Enter` salvar, `Ctrl/Cmd + K` buscar, `Alt + N` novo prompt.
- ✅ Menu lateral recolhível (a escolha fica salva) e layout responsivo, com menu em gaveta no celular.
- ✅ Prompts criados na versão anterior continuam funcionando (migração automática).

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
4. Use a barra de busca, as tags e a ordenação para encontrar prompts.
5. Clique em um item da lista para carregar e editar.
6. Clique no ícone de lixeira para remover.
7. Clique em **Copiar** para enviar o conteúdo para a área de transferência.

## Regras de validação

- O sistema exige **título** e **conteúdo** para salvar.
- Se um prompt estiver selecionado, o botão **Salvar** atualiza esse prompt.
- Se não houver prompt selecionado, o sistema cria um novo item.

## Persistência de dados

- A aplicação utiliza `localStorage` com as chaves:
  - `prompts_storage` (prompts) e `prompts_ui` (ordenação e menu recolhido)
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
- Os dados não são sincronizados entre dispositivos (use Exportar/Importar).

## Sugestões de evolução

- Pastas ou coleções de prompts.
- Histórico de versões de cada prompt.
- Versão com backend para sincronização.

## Licença

Defina aqui a licença do projeto (ex.: MIT) caso deseje distribuição aberta.
