param(
 [Parameter(Mandatory=$true)][string]$Root,
 [int]$Port=8765
)
$ErrorActionPreference="Stop"
$rootPath=[IO.Path]::GetFullPath($Root)
$listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$Port)
$listener.Start()
Write-Host "معاونت ۷ - سرور محلی فعال است: http://127.0.0.1:$Port/" -ForegroundColor Cyan
Write-Host "برای پایان، این پنجره را ببندید." -ForegroundColor Yellow
function Send-Response($stream,[int]$code,[string]$reason,[string]$type,[byte[]]$bytes){
 $head="HTTP/1.1 $code $reason`r`nContent-Type: $type`r
Content-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r
X-Content-Type-Options: nosniff`r`n`r`n"
 $headerBytes=[Text.Encoding]::ASCII.GetBytes($head)
 $stream.Write($headerBytes,0,$headerBytes.Length)
 if($bytes.Length -gt 0){$stream.Write($bytes,0,$bytes.Length)}
}
function Get-ContentType([string]$extension){
 switch($extension.ToLowerInvariant()){
  ".html" {"text/html; charset=utf-8"}
  ".js" {"text/javascript; charset=utf-8"}
  ".mjs" {"text/javascript; charset=utf-8"}
  ".css" {"text/css; charset=utf-8"}
  ".json" {"application/json; charset=utf-8"}
  ".webmanifest" {"application/manifest+json; charset=utf-8"}
  ".svg" {"image/svg+xml"}
  ".png" {"image/png"}
  ".jpg" {"image/jpeg"}
  ".jpeg" {"image/jpeg"}
  ".webp" {"image/webp"}
  ".ico" {"image/x-icon"}
  ".woff" {"font/woff"}
  ".woff2" {"font/woff2"}
  ".ttf" {"font/ttf"}
  ".txt" {"text/plain; charset=utf-8"}
  default {"application/octet-stream"}
 }
}
try{
 while($true){
  $client=$listener.AcceptTcpClient()
  try{
   $stream=$client.GetStream()
   $stream.ReadTimeout=8000
   $reader=[IO.StreamReader]::new($stream,[Text.Encoding]::ASCII,$false,1024,$true)
   $requestLine=$reader.ReadLine()
   if(!$requestLine){continue}
   while($true){$headerLine=$reader.ReadLine();if($null -eq $headerLine -or $headerLine -eq ""){break}}
   $parts=$requestLine.Split(" ")
   if($parts.Length -lt 2 -or $parts[0] -notin @("GET","HEAD")){
    $bytes=[Text.Encoding]::UTF8.GetBytes("درخواست پشتیبانی نمی‌شود.")
    Send-Response $stream 405 "Method Not Allowed" "text/plain; charset=utf-8" $bytes
    continue
   }
   $uri=[Uri]::new("http://127.0.0.1:$Port$($parts[1])")
   $relative=[Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/")).Replace("/",[IO.Path]::DirectorySeparatorChar)
   if([string]::IsNullOrWhiteSpace($relative)){$relative="deputies\deputy-07\pages\mission-create.html"}
   $full=[IO.Path]::GetFullPath([IO.Path]::Combine($rootPath,$relative))
   $prefix=$rootPath.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
   if(!$full.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){
    $bytes=[Text.Encoding]::UTF8.GetBytes("مسیر نامعتبر است.")
    Send-Response $stream 403 "Forbidden" "text/plain; charset=utf-8" $bytes
   }elseif(!(Test-Path -LiteralPath $full -PathType Leaf)){
    $bytes=[Text.Encoding]::UTF8.GetBytes("فایل پیدا نشد.")
    Send-Response $stream 404 "Not Found" "text/plain; charset=utf-8" $bytes
   }else{
    $bytes=[IO.File]::ReadAllBytes($full)
    if($parts[0] -eq "HEAD"){$bytes=[byte[]]@()}
    $type=Get-ContentType ([IO.Path]::GetExtension($full))
    Send-Response $stream 200 "OK" $type $bytes
   }
  }catch{
   try{$bytes=[Text.Encoding]::UTF8.GetBytes("خطای سرور محلی: "+$_.Exception.Message);Send-Response $stream 500 "Internal Server Error" "text/plain; charset=utf-8" $bytes}catch{}
  }finally{$client.Close()}
 }
}finally{$listener.Stop()}
