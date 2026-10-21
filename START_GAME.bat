@echo off
title LIFE//SIM dev server
cd /d "%~dp0game"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
start "" http://localhost:5173
call npm run dev
