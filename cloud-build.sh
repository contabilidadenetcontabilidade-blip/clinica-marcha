#!/bin/bash
# Script de Deploy para Google Cloud Run

# Configurar ID do Projeto
PROJECT_ID="contabilidadenet-frontend-274648683392"
REGION="us-central1"
SERVICE_NAME="clinica-marcha"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Iniciando processo de build e deploy..."

# 1. Configurar Projeto
gcloud config set project $PROJECT_ID

# 2. Build da Imagem Docker no Cloud Build
# Substituir por sua tag de versão se desejar
gcloud builds submit --tag $IMAGE_NAME .

# 3. Deploy no Cloud Run
# AVISO: As variáveis de ambiente DATABASE_URL e JWT_SECRET devem ser configuradas no console do Cloud Run ou passadas aqui.
# Por segurança, não incluímos a senha do banco no script.
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production

echo "Deploy finalizado!"
