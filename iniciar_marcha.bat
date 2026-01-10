@echo off
:: ==========================================
:: Script de Inicialização - Clínica Marcha
:: ==========================================

:: Verifica se a porta 3000 já está em uso
netstat -ano | find "3000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo O sistema ja esta rodando!
    echo Abrindo navegador...
    start http://localhost:3000
    exit
)

:: Se não estiver rodando, inicia o servidor
echo Iniciando servidor da Clinica Marcha...
cd /d "%~dp0backend"

:: Inicia em modo minimizado para não atrapalhar
start /min npm start

:: Aguarda 3 segundos para garantir que o Node subiu
timeout /t 3 /nobreak >nul

:: Abre o navegador
start http://localhost:3000

exit
