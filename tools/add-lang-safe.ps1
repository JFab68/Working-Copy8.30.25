# add-lang-safe.ps1 — add lang="en" only to your project HTML (skip deps/artifacts)
$rx = '[\\/](node_modules|\.git|audits|visual-audit-results)[\\/]'

Get-ChildItem -Recurse -Filter *.html -File | Where-Object {
  $_.FullName -notmatch $rx
} | ForEach-Object {
  $p = $_.FullName
  $html = Get-Content $p -Raw
  if ($html -match '<html(?![^>]*\blang=)') {
    $new = $html -replace '<html\b', '<html lang="en"'
    Set-Content -Path $p -Value $new -Encoding UTF8
    Write-Host "Updated lang in: $p"
  }
}
