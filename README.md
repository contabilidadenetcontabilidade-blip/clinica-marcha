# Sistema de Gestão Marcha

Sistema completo de gestão para a Clínica Marcha - Reabilitação e Perícia, incluindo módulos de gestão de clínica e sistema de gamificação Marcha Cup.

## 🎯 Funcionalidades

### Módulos de Gestão da Clínica

- **Cadastro de Pacientes**: CRUD completo com informações pessoais, contatos de emergência e dados de convênio
- **Agenda/Agendamentos**: Visualização diária e semanal, criação e edição de agendamentos
- **Gestão Financeira**: Controle de receitas e despesas, resumo financeiro, categorização de transações

### Marcha Cup (Sistema de Competição)

- **Casas**: 5 casas padrão (Cadillac, Reformer, Chair, Barrel, Tower)
- **Atletas**: Cadastro de atletas vinculados às casas
- **Sistema de Pontuação**: Regras customizáveis (positivas e negativas)
- **Rankings**: Ranking geral de casas e ranking detalhado por atleta dentro de cada casa

## 🚀 Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)

### Passo a Passo

1. **Instalar dependências do backend:**

```bash
cd gestao_marcha/backend
npm install
```

2. **Inicializar banco de dados, casas e regras padrão:**

O banco de dados será criado automaticamente quando você iniciar o servidor. Para criar as 5 casas padrão e regras de pontuação do Marcha Cup:

```bash
# Inicializar tudo de uma vez (recomendado)
npm run init

# Ou inicializar separadamente:
npm run init-houses    # Cria as 5 casas padrão
npm run init-rules     # Cria as regras de pontuação padrão
```

3. **Iniciar o servidor:**

```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

4. **Acessar a aplicação:**

Abra seu navegador e acesse: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
gestao_marcha/
├── backend/
│   ├── index.js          # Servidor Express e API REST
│   ├── db.js             # Conexão com SQLite
│   ├── schema.sql        # Schema do banco de dados
│   ├── init_houses.js    # Script de inicialização das casas
│   ├── package.json      # Dependências do backend
│   └── marcha.db         # Banco de dados SQLite (criado automaticamente)
├── frontend/
│   ├── index.html        # Página inicial/dashboard
│   ├── pacientes.html    # Módulo de pacientes
│   ├── agenda.html       # Módulo de agenda
│   ├── financeiro.html   # Módulo financeiro
│   ├── cup.html          # Marcha Cup - Ranking geral
│   ├── casa_detalhe.html # Detalhes de uma casa
│   ├── atleta_detalhe.html # Detalhes de um atleta
│   ├── regras.html       # Gestão de regras de pontuação
│   ├── utils.js          # Funções utilitárias compartilhadas
│   └── *.js              # Scripts JavaScript de cada página
└── assets/
    └── houses/           # Brasões das casas (upload)
```

## 🔧 API Endpoints

### Pacientes
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:id` - Buscar paciente específico
- `POST /api/patients` - Criar paciente
- `PUT /api/patients/:id` - Atualizar paciente
- `DELETE /api/patients/:id` - Desativar paciente (soft delete)

### Agendamentos
- `GET /api/appointments` - Listar agendamentos (suporta filtros: date, start_date, end_date, patient_id, status)
- `GET /api/appointments/:id` - Buscar agendamento específico
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Deletar agendamento

### Financeiro
- `GET /api/financial` - Listar transações (suporta filtros: type, start_date, end_date, patient_id)
- `GET /api/financial/summary` - Resumo financeiro
- `POST /api/financial` - Criar transação
- `PUT /api/financial/:id` - Atualizar transação
- `DELETE /api/financial/:id` - Deletar transação

### Marcha Cup - Casas
- `GET /api/houses` - Listar casas
- `GET /api/houses/:id` - Buscar casa específica
- `GET /api/houses/:id/dashboard` - Dashboard da casa (total, ranking atletas, melhor categoria)
- `POST /api/houses` - Criar casa (com upload de brasão)

### Marcha Cup - Atletas
- `GET /api/athletes/:id` - Buscar atleta específico
- `GET /api/athletes/:id/scores` - Histórico de pontos do atleta
- `GET /api/houses/:id/athletes` - Listar atletas de uma casa
- `POST /api/athletes` - Criar atleta

### Marcha Cup - Regras e Pontuação
- `GET /api/rules` - Listar regras de pontuação
- `POST /api/rules` - Criar regra
- `DELETE /api/rules/:id` - Desativar regra
- `POST /api/scores` - Registrar pontos

## 🎮 Como Usar o Marcha Cup

1. **Criar Casas**: As 5 casas padrão são criadas automaticamente ao rodar `npm run init-houses`
2. **Cadastrar Atletas**: Acesse uma casa e clique em "+ Atleta"
3. **Criar Regras**: Vá em "Regras de Pontuação" e crie categorias (ex: "Presença" = +10, "Desafio Completo" = +20)
4. **Registrar Pontos**: Na página da casa, clique em "+ Pontos" e selecione atleta e regra
5. **Acompanhar Ranking**: Veja o ranking geral em "Marcha Cup" ou o detalhado por casa

## 📝 Notas Importantes

- O banco de dados SQLite é criado automaticamente na primeira execução
- Todas as imagens de brasões são salvas em `assets/houses/`
- O sistema usa soft delete para pacientes e regras (marca como inativo)
- Agendamentos e transações financeiras são deletados permanentemente

## 🐛 Resolução de Problemas

### Erro ao iniciar o servidor
- Verifique se a porta 3000 está disponível
- Certifique-se de que todas as dependências foram instaladas (`npm install`)

### Banco de dados não criado
- Verifique se a pasta `backend/` tem permissões de escrita
- O arquivo `marcha.db` será criado automaticamente

### Casas não aparecem
- Execute `npm run init-houses` no diretório `backend/`

## 📞 Suporte

Para dúvidas ou problemas, verifique os logs do servidor no terminal onde está rodando.

---

**Versão:** 1.0.0  
**Desenvolvido para:** Clínica Marcha - Reabilitação e Perícia

