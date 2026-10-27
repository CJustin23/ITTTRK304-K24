@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------
@IF "%DEBUG%" == "" @ECHO OFF
@SETLOCAL EnableExtensions EnableDelayedExpansion

SET "DIRNAME=%~dp0"
IF "%DIRNAME%" == "" SET "DIRNAME=."
SET "APP_BASE_NAME=%~nx0"
SET "APP_HOME=%DIRNAME%"

@REM Execute a user defined script before this one
IF EXIST "%USERPROFILE%\mavenrc_pre.bat" call "%USERPROFILE%\mavenrc_pre.bat"

SET "WRAPPER_JAR=%APP_HOME%\.mvn\wrapper\maven-wrapper.jar"
SET "WRAPPER_PROPERTIES=%APP_HOME%\.mvn\wrapper\maven-wrapper.properties"

IF EXIST "%WRAPPER_JAR%" GOTO run_mvn

@REM Fallback to system maven or download if needed
where mvn >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    mvn %*
    EXIT /B %ERRORLEVEL%
)

ECHO Maven wrapper jar not found. Please install Apache Maven or initialize wrapper jar.
EXIT /B 1

:run_mvn
java -jar "%WRAPPER_JAR%" %*
EXIT /B %ERRORLEVEL%
