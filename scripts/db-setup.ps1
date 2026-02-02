$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) {
  Write-Error "SUPABASE_DB_URL is not set. Set it to your Supabase DB connection string."
  exit 1
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error "psql not found. Install PostgreSQL client tools and ensure psql is on PATH."
  exit 1
}

$files = @(
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_rls_policies.sql",
  "supabase/migrations/003_add_profile_username.sql",
  "supabase/seed.sql"
)

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    Write-Error "Missing SQL file: $file"
    exit 1
  }
}

foreach ($file in $files) {
  Write-Host "Running $file..."
  & psql $dbUrl -v "ON_ERROR_STOP=1" -f $file
}

Write-Host "Database setup complete."

