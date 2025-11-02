# Create PNG icons from SVG
Add-Type -AssemblyName System.Drawing

# Function to convert SVG to PNG
function Convert-SVGToPNG {
    param (
        [string]$InputFile,
        [string]$OutputFile,
        [int]$Width,
        [int]$Height
    )

    # Load the SVG
    $svg = [System.Drawing.Image]::FromFile($InputFile)
    
    # Create new bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Draw SVG onto bitmap
    $graphics.DrawImage($svg, 0, 0, $Width, $Height)
    
    # Save as PNG
    $bitmap.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    $svg.Dispose()
}

# Convert icons
Convert-SVGToPNG -InputFile "icons/icon-192.svg" -OutputFile "icons/icon-192.png" -Width 192 -Height 192
Convert-SVGToPNG -InputFile "icons/icon-192.svg" -OutputFile "icons/icon-512.png" -Width 512 -Height 512

Write-Host "Icons generated successfully!"
