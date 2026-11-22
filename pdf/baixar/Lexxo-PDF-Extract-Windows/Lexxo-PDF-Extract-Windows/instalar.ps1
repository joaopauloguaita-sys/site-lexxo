# Instalador do Lexxo PDF Extract (Windows 10/11) - sem direitos de administrador
$ErrorActionPreference = 'Stop'
$origem = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = Join-Path $env:LOCALAPPDATA 'LexxoPDF'
$html = Join-Path $destino 'Lexxo-PDF-Extract.html'
Write-Host ''
Write-Host '  Instalando o Lexxo PDF Extract...' -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $destino | Out-Null
foreach ($f in 'Lexxo-PDF-Extract.html', 'logo.ico') {
  $src = Join-Path $origem $f
  if (-not (Test-Path $src)) { throw "Arquivo nao encontrado: $f (extraia o ZIP inteiro antes de instalar)" }
  Copy-Item $src (Join-Path $destino $f) -Force
}
$ico = Join-Path $destino 'logo.ico'
$url = ([System.Uri]$html).AbsoluteUri
# procura o Edge ou o Chrome para abrir como "aplicativo" (janela propria, sem abas)
$cands = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$nav = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
$sh = New-Object -ComObject WScript.Shell
function Novo-Atalho($caminho) {
  $a = $sh.CreateShortcut($caminho)
  if ($nav) { $a.TargetPath = $nav; $a.Arguments = "--app=`"$url`"" } else { $a.TargetPath = $html }
  $a.IconLocation = $ico
  $a.WorkingDirectory = $destino
  $a.Description = 'Lexxo PDF Extract'
  $a.Save()
}
$desk = [Environment]::GetFolderPath('Desktop')
$menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Lexxo PDF Extract'
New-Item -ItemType Directory -Force -Path $menu | Out-Null
Novo-Atalho (Join-Path $desk 'Lexxo PDF Extract.lnk')
Novo-Atalho (Join-Path $menu 'Lexxo PDF Extract.lnk')
# desinstalador
$un = @"
@echo off
title Desinstalar Lexxo PDF Extract
del "%USERPROFILE%\Desktop\Lexxo PDF Extract.lnk" 2>nul
del "$desk\Lexxo PDF Extract.lnk" 2>nul
rmdir /s /q "$menu" 2>nul
cd /d "%TEMP%"
rmdir /s /q "$destino" 2>nul
echo Lexxo PDF Extract removido.
pause
"@
Set-Content -Path (Join-Path $destino 'Desinstalar.bat') -Value $un -Encoding ASCII
$a = $sh.CreateShortcut((Join-Path $menu 'Desinstalar.lnk')); $a.TargetPath = (Join-Path $destino 'Desinstalar.bat'); $a.IconLocation = $ico; $a.Save()
Write-Host ''
Write-Host '  Pronto! O icone "Lexxo PDF Extract" foi criado na Area de Trabalho e no Menu Iniciar.' -ForegroundColor Green
if (-not $nav) { Write-Host '  (Nao encontrei Edge/Chrome: o atalho abre no navegador padrao.)' }
Start-Process ($sh.CreateShortcut((Join-Path $desk 'Lexxo PDF Extract.lnk'))).FullName
