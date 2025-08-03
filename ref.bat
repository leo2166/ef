@echo off
title Respaldando carpeta PIA
echo ===============================
echo Iniciando respaldo de carpeta PIA...
echo ===============================

rem Ruta origen y destino
set SOURCE=C:\Users\LF\PIA
set DEST=D:\respaldoEF

rem Obtener fecha y hora con formato limpio
for /f "tokens=2 delims==" %%I in ('"wmic os get localdatetime /value"') do set datetime=%%I
set yyyy=%datetime:~0,4%
set MM=%datetime:~4,2%
set dd=%datetime:~6,2%
set hh=%datetime:~8,2%
set min=%datetime:~10,2%
set ss=%datetime:~12,2%
set BACKUP_NAME=respaldo_%yyyy%-%MM%-%dd%_%hh%-%min%-%ss%.zip

rem Crear carpeta de respaldo si no existe
if not exist "%DEST%" (
    mkdir "%DEST%"
)

rem Comprimir carpeta usando PowerShell
powershell -Command "Compress-Archive -Path '%SOURCE%\*' -DestinationPath '%DEST%\%BACKUP_NAME%'"

rem Simular barra de progreso
for %%P in (11 22 33 44 55 66 77 88 100) do (
    echo Respaldo: %%P%% completado
    timeout /t 1 /nobreak >nul
)

echo ===============================
echo Archivos respaldados en: %DEST%\%BACKUP_NAME%
echo ===============================
pause
