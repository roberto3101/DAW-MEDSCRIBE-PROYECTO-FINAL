@echo off
REM Script para arrancar el gateway Spring Boot.
REM Requiere Java 17+ y Maven en el PATH.

cd /d "%~dp0"
mvn spring-boot:run
