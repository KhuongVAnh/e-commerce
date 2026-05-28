@echo off
set "BACKEND_ROOT=%~dp0"

start "api_gateway" cmd /k "cd /d ""%BACKEND_ROOT%api_gateway"" && npm run dev"
start "auth_service" cmd /k "cd /d ""%BACKEND_ROOT%auth_service"" && npm run dev"
start "catalog_service" cmd /k "cd /d ""%BACKEND_ROOT%catalog_service"" && npm run dev"
start "commerce_service" cmd /k "cd /d ""%BACKEND_ROOT%commerce_service"" && npm run dev"
