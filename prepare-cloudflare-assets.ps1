$ErrorActionPreference = 'Stop'

$sourceRoot = (Resolve-Path $PSScriptRoot).Path
$target = Join-Path $sourceRoot '.deploy-assets'
$resolvedParent = (Resolve-Path (Split-Path $target -Parent)).Path
if ($resolvedParent -ne $sourceRoot -or (Split-Path $target -Leaf) -ne '.deploy-assets') {
    throw 'Refusing to prepare assets outside the expected .deploy-assets directory.'
}

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
}
New-Item -ItemType Directory -Path $target | Out-Null

Get-ChildItem -LiteralPath $sourceRoot -File | Where-Object {
    $_.Extension -in '.html', '.js', '.css' -or $_.Name -eq 'CNAME'
} | Copy-Item -Destination $target -Force

$images = Join-Path $sourceRoot 'images'
if (Test-Path -LiteralPath $images) {
    Copy-Item -LiteralPath $images -Destination (Join-Path $target 'images') -Recurse -Force
}

Write-Output "Prepared $((Get-ChildItem -LiteralPath $target -Recurse -File).Count) public assets in $target"
