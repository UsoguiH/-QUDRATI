# Renders assets/og.png (1200x630 social share card) with GDI+.
# Arabic strings live in og-text.txt (UTF-8) because PS 5.1 mangles
# non-BOM UTF-8 script files.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$lines = [System.IO.File]::ReadAllLines((Join-Path $PSScriptRoot "og-text.txt"), [System.Text.Encoding]::UTF8)
$title = $lines[0]; $sub = $lines[1]; $domain = $lines[2]

$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$g.TextRenderingHint = "AntiAlias"

# background
$green = [System.Drawing.Color]::FromArgb(88, 204, 2)
$greenDk = [System.Drawing.Color]::FromArgb(88, 167, 0)
$g.Clear($green)
# darker bottom lip (the Duolingo 3D-button look)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($greenDk)), 0, $H - 14, $W, 14)

# faint corner diamonds
$wash = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 255, 255, 255))
foreach ($d in @(@(95, 95, 46), @(1105, 130, 34), @(150, 520, 30), @(1060, 500, 44))) {
    $cx = $d[0]; $cy = $d[1]; $r = $d[2]
    $pts = @(
        (New-Object System.Drawing.PointF($cx, ($cy - $r))),
        (New-Object System.Drawing.PointF(($cx + $r), $cy)),
        (New-Object System.Drawing.PointF($cx, ($cy + $r))),
        (New-Object System.Drawing.PointF(($cx - $r), $cy))
    )
    $g.FillPolygon($wash, $pts)
}

# gold star (5 points, tip up) with darker offset for depth
function StarPoints($cx, $cy, $rOut, $rIn) {
    $pts = @()
    for ($i = 0; $i -lt 10; $i++) {
        $ang = -90 + $i * 36
        $r = if ($i % 2 -eq 0) { $rOut } else { $rIn }
        $rad = $ang * [Math]::PI / 180
        $pts += New-Object System.Drawing.PointF(($cx + $r * [Math]::Cos($rad)), ($cy + $r * [Math]::Sin($rad)))
    }
    return $pts
}
$goldDk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 160, 0))
$gold = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 200, 0))
$g.FillPolygon($goldDk, (StarPoints 600 152 86 36))
$g.FillPolygon($gold, (StarPoints 600 144 86 36))

# text (centered; GDI+ shapes Arabic)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = "Center"
$white = [System.Drawing.Brushes]::White
$soft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))

$titleFont = New-Object System.Drawing.Font("Segoe UI", 92, [System.Drawing.FontStyle]::Bold)
$g.DrawString($title, $titleFont, $white, (New-Object System.Drawing.RectangleF(0, 240, $W, 160)), $fmt)

$subFont = New-Object System.Drawing.Font("Segoe UI", 31, [System.Drawing.FontStyle]::Bold)
$g.DrawString($sub, $subFont, $soft, (New-Object System.Drawing.RectangleF(0, 418, $W, 70)), $fmt)

# white pill with the domain
$pillW = 340; $pillH = 66; $pillX = ($W - $pillW) / 2; $pillY = 506
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$rr = 33
$path.AddArc($pillX, $pillY, $rr * 2, $rr * 2, 90, 180)
$path.AddArc($pillX + $pillW - $rr * 2, $pillY, $rr * 2, $rr * 2, 270, 180)
$path.CloseFigure()
$g.FillPath([System.Drawing.Brushes]::White, $path)
$domFont = New-Object System.Drawing.Font("Segoe UI", 27, [System.Drawing.FontStyle]::Bold)
$domBrush = New-Object System.Drawing.SolidBrush($greenDk)
$g.DrawString($domain, $domFont, $domBrush, (New-Object System.Drawing.RectangleF(0, ($pillY + 9), $W, 50)), $fmt)

$out = Join-Path $root "assets\og.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Saved $out"
