@echo off
setlocal enabledelayedexpansion
title MedScribe AI (DAW-Final) - Java + Angular + MySQL
color 0A

echo =========================================
echo   MedScribe AI - Proyecto DAW Final
echo   Stack: Spring Boot + Angular + MySQL
echo =========================================
echo.

REM ========== Matar procesos anteriores ==========
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":8000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":3000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

REM ========== Levantar todo en paralelo ==========
echo [1/3] Iniciando Servicio IA (Python FastAPI :8000)...
pushd "%~dp0servicio-ia"
start "" /b cmd /c "uvicorn principal:app --host 0.0.0.0 --port 8000 --reload 2>&1"
popd

echo [2/3] Iniciando Gateway Java Spring Boot (:5000)...
start "" /b cmd /c "%~dp0gateway-java\run-gateway.cmd"

if exist "%~dp0cliente-web\package.json" (
    echo [3/3] Iniciando Frontend Angular (:3000^)...
    pushd "%~dp0cliente-web"
    if not exist node_modules (
        echo    ^> node_modules no encontrado, ejecutando npm install primero...
        call npm install
    )
    start "" /b cmd /c "npm start 2>&1"
    popd
) else (
    echo [3/3] Frontend no encontrado, omitiendo.
)

echo.
echo Esperando que los servicios levanten (Java tarda ~25s en primer arranque)...
timeout /t 30 >nul

REM ========== Verificacion concurrente ==========
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:8000/ > "%TEMP%\ms_t01.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/pacientes > "%TEMP%\ms_t02.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} -X POST http://localhost:5000/api/autenticacion/iniciar-sesion -H "Content-Type: application/json" --data-raw "{\"correo\":\"admin@medscribe.pe\",\"contrasena\":\"Admin2026!\"}" > "%TEMP%\ms_t03.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:3000/ > "%TEMP%\ms_t04.tmp" 2>nul"

timeout /t 4 >nul

echo.
echo =========================================
echo   SERVICIOS
echo =========================================

set /p R01=<"%TEMP%\ms_t01.tmp" 2>nul
if "!R01!"=="200" (echo   [OK] Servicio IA      http://localhost:8000/) else (echo   [!!] Servicio IA      http://localhost:8000/ [!R01!])

set /p R02=<"%TEMP%\ms_t02.tmp" 2>nul
if "!R02!"=="401" (
    echo   [OK] Gateway Java     http://localhost:5000/api/pacientes ^(401 - requiere login, esperado^)
) else (
    if "!R02!"=="200" (
        echo   [OK] Gateway Java     http://localhost:5000/api/pacientes
    ) else (
        echo   [!!] Gateway Java     http://localhost:5000/api/pacientes [!R02!]
    )
)

set /p R03=<"%TEMP%\ms_t03.tmp" 2>nul
if "!R03!"=="200" (echo   [OK] Login endpoint   POST /api/autenticacion/iniciar-sesion) else (echo   [!!] Login endpoint   POST /api/autenticacion/iniciar-sesion [!R03!])

set /p R04=<"%TEMP%\ms_t04.tmp" 2>nul
if "!R04!"=="200" (echo   [OK] Frontend Angular http://localhost:3000/) else (echo   [!!] Frontend Angular http://localhost:3000/ [!R04!])

echo   [--] MySQL            localhost:3306 / MedScribeDB

del "%TEMP%\ms_t*.tmp" 2>nul

echo.
echo =========================================
echo   CREDENCIALES POR DEFECTO
echo =========================================
echo   Admin:  admin@medscribe.pe  / Admin2026!
echo   Medico: jroberto@medscribe.pe / Medico2026!
echo.
echo   URL principal: http://localhost:3000/
echo.
echo Presiona cualquier tecla para detener todos los servicios...
pause >nul

REM ========== Detener servicios ==========
echo.
echo Deteniendo servicios...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":8000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":3000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo Todos los servicios detenidos.
endlocal
