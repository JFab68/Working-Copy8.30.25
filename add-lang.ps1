# add-lang.ps1 — add lang="en" to <html> where missing
Get-ChildItem -Recurse -Filter *.html | ForEach-Object {
  $p = $_.FullName
  $html = Get-Content $p -Raw
  if ($html -match '<html(?![^>]*\blang=)') {
    $new = $html -replace '<html\b', '<html lang="en"'
    Set-Content -Path $p -Value $new -Encoding UTF8
    Write-Host "Updated lang in: $p"
  }
}
