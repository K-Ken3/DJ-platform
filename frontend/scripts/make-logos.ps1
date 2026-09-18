Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$src = 'C:\Users\Karasira\Documents\DJ-platform\frontend\public\ChatGPT Image Sep 17, 2026, 07_30_01 PM.png'
$dstDir = 'C:\Users\Karasira\Documents\DJ-platform\frontend\public'
$darkOut = Join-Path $dstDir 'logo.png'
$whiteOut = Join-Path $dstDir 'logo-white.png'

$img = [System.Drawing.Bitmap]::FromFile($src)
$targetW = 500
$targetH = [int][math]::Round($img.Height * ($targetW / [double]$img.Width))

function New-Scaled([System.Drawing.Bitmap]$source, [int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($source, 0, 0, $w, $h)
  $g.Dispose()
  return $bmp
}

function Recolor-To([System.Drawing.Bitmap]$bmp, [byte]$r, [byte]$g, [byte]$b) {
  $copy = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)
  $bd = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $bd.Stride
  $bytes = New-Object byte[] ($stride * $bd.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($bd.Scan0, $bytes, 0, $bytes.Length)
  $bmp.UnlockBits($bd)
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $i = ($y * $stride) + ($x * 4)
      $a = $bytes[$i + 3]
      if ($a -gt 0) {
        $bytes[$i] = $b
        $bytes[$i + 1] = $g
        $bytes[$i + 2] = $r
      }
    }
  }
  $bd2 = $copy.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $bd2.Scan0, $bytes.Length)
  $copy.UnlockBits($bd2)
  return $copy
}

# White variant: original white glyphs, scaled to 500px (used on dark backgrounds)
$white = New-Scaled $img $targetW $targetH
$white.Save($whiteOut, [System.Drawing.Imaging.ImageFormat]::Png)
$white.Dispose()

# Dark variant: near-black (zinc-900) glyphs (used on light backgrounds)
$dark = New-Scaled $img $targetW $targetH
$dark = Recolor-To $dark 24 24 27
$dark.Save($darkOut, [System.Drawing.Imaging.ImageFormat]::Png)
$dark.Dispose()

$img.Dispose()
Write-Output "generated:"
Get-Item $whiteOut, $darkOut | Select-Object Name, Length