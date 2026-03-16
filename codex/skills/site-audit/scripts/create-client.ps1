param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Slug,

    [switch]$Force,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Slug -notmatch '^[a-z0-9-]+$') {
    throw "Slug must use lowercase letters, digits, and hyphens only."
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$templateRoot = Join-Path $repoRoot 'template'
$clientsRoot = Join-Path $repoRoot 'clients'
$destinationRoot = Join-Path $clientsRoot $Slug

if (-not (Test-Path -LiteralPath $templateRoot)) {
    throw "Template folder not found: $templateRoot"
}

if ((Test-Path -LiteralPath $destinationRoot) -and -not $Force) {
    throw "Destination already exists: $destinationRoot"
}

function Test-ExcludedPath {
    param(
        [string]$RelativePath
    )

    $normalized = $RelativePath -replace '\\', '/'
    return $normalized -match '(^|/)node_modules(/|$)'
}

function Ensure-Directory {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

$items = Get-ChildItem -LiteralPath $templateRoot -Recurse -Force
$copyCount = 0

if (-not $DryRun) {
    Ensure-Directory -Path $clientsRoot
    if ($Force -and (Test-Path -LiteralPath $destinationRoot)) {
        Remove-Item -LiteralPath $destinationRoot -Recurse -Force
    }
    Ensure-Directory -Path $destinationRoot
}

foreach ($item in $items) {
    $relativePath = $item.FullName.Substring($templateRoot.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
        continue
    }

    if (Test-ExcludedPath -RelativePath $relativePath) {
        continue
    }

    $targetPath = Join-Path $destinationRoot $relativePath

    if ($DryRun) {
        Write-Host "[DRY RUN] $relativePath"
        $copyCount++
        continue
    }

    if ($item.PSIsContainer) {
        Ensure-Directory -Path $targetPath
    } else {
        Ensure-Directory -Path (Split-Path -Parent $targetPath)
        Copy-Item -LiteralPath $item.FullName -Destination $targetPath -Force
    }

    $copyCount++
}

if ($DryRun) {
    Write-Host "Dry run complete. $copyCount items would be copied to $destinationRoot"
} else {
    Write-Host "Client scaffold created at $destinationRoot"
    Write-Host "Next steps:"
    Write-Host "  1. cd `"$destinationRoot`""
    Write-Host "  2. npm install"
    Write-Host "  3. npm run setup"
}
