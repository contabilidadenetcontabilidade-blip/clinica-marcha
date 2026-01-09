# 🧪 Guia de Teste Rápido

## ✅ Status da Instalação

- ✅ Dependências instaladas
- ✅ Casas padrão inicializadas (Cadillac, Reformer, Chair, Barrel, Tower)
- ✅ Regras de pontuação inicializadas

## 🚀 Como Testar

### 1. Iniciar o Servidor

No terminal, dentro da pasta `gestao_marcha/backend`:

```bash
npm start
```

Você deve ver:
```
Banco pronto e tabelas criadas!
Gestão Marcha rodando em http://localhost:3000
```

### 2. Acessar a Aplicação

Abra seu navegador e acesse:
```
http://localhost:3000
```

### 3. Testes Recomendados

#### Teste 1: Página Inicial
- ✅ Deve mostrar dashboard com agenda do dia
- ✅ Deve mostrar resumo financeiro
- ✅ Botão "Marcha Cup 🏆" deve funcionar

#### Teste 2: Cadastro de Pacientes
1. Clique em "🧍 Pacientes" no menu
2. Clique em "+ Novo Paciente"
3. Preencha nome (obrigatório) e outros campos
4. Salve
5. Verifique se aparece na lista

#### Teste 3: Agenda
1. Clique em "🏋️‍♀️ Agenda" no menu
2. Mude entre visualização "Dia" e "Semana"
3. Clique em "+ Novo Agendamento"
4. Selecione um paciente
5. Preencha data, horário e tipo de serviço
6. Salve e verifique na agenda

#### Teste 4: Financeiro
1. Clique em "💰 Financeiro" no menu
2. Verifique o resumo financeiro (deve estar zerado inicialmente)
3. Clique em "+ Receita"
4. Preencha: Descrição, Valor, Categoria
5. Salve e verifique se aparece na lista
6. Teste criar uma despesa também

#### Teste 5: Marcha Cup
1. Clique em "🏆 Marcha Cup" (ou botão na página inicial)
2. Verifique se as 5 casas aparecem
3. Clique em uma casa para ver detalhes
4. Clique em "+ Atleta" e cadastre um atleta
5. Vá em "Regras de Pontuação" e verifique as regras padrão
6. Na página da casa, clique em "+ Pontos"
7. Selecione atleta e regra, registre pontos
8. Verifique se o ranking foi atualizado

### 4. Testar API Diretamente

Você pode testar os endpoints da API diretamente:

```bash
# Listar casas
curl http://localhost:3000/api/houses

# Listar pacientes
curl http://localhost:3000/api/patients

# Listar agendamentos
curl http://localhost:3000/api/appointments

# Listar transações financeiras
curl http://localhost:3000/api/financial

# Resumo financeiro
curl http://localhost:3000/api/financial/summary

# Listar regras de pontuação
curl http://localhost:3000/api/rules
```

## 🔍 Possíveis Problemas

### Servidor não inicia
- Verifique se a porta 3000 está livre
- Veja os erros no terminal

### Banco de dados não criado
- Verifique permissões da pasta `backend/`
- O arquivo `marcha.db` será criado automaticamente

### Página não carrega
- Verifique se o servidor está rodando
- Verifique o console do navegador (F12) para erros

## 📊 Dados Iniciais

Após rodar `npm run init`, você terá:
- 5 casas: Cadillac, Reformer, Chair, Barrel, Tower
- 5 regras de pontuação:
  - Presença na Aula (+10)
  - Desafio Completo (+20)
  - Atividade Extra (+15)
  - Falta sem Aviso (-5)
  - Atitude Destrutiva (-10)

## ✅ Checklist de Funcionalidades

- [ ] Servidor inicia sem erros
- [ ] Página inicial carrega
- [ ] Navegação entre páginas funciona
- [ ] Cadastro de pacientes funciona
- [ ] Agenda diária e semanal funcionam
- [ ] Criar agendamento funciona
- [ ] Financeiro cria receitas/despesas
- [ ] Resumo financeiro calcula corretamente
- [ ] Marcha Cup mostra as 5 casas
- [ ] Cadastro de atletas funciona
- [ ] Registro de pontos funciona
- [ ] Rankings atualizam corretamente

---

**Pronto para testar!** 🎉



