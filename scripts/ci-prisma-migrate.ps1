Param()
Set-StrictMode -Version Latest

# If DATABASE_URL is not set, default to file:./dev.db
if (-not $env:DATABASE_URL) { $env:DATABASE_URL = 'file:./dev.db' }

Write-Output "Using DATABASE_URL=$env:DATABASE_URL"

# Change to repository root (assumes script is in ./scripts)
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptRoot '..')

Set-Location ./backend

# Run prisma migrate deploy
npx prisma migrate deploy
