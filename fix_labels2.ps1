$file = 'c:\os_manager_moded\src\components\os\print\printOS.ts'
$content = Get-Content $file -Raw

# Fix the corrupted label-os block that has escaped \r\n characters literally
$badBlock = "        .label-os {`r`n          font-size: 10px;`r`n          font-weight: bold;`r`n          color: #000;\r\n        }\r\n\r\n        .label-client {"
$goodBlock = "        .label-os {`r`n          font-size: 10px;`r`n          font-weight: bold;`r`n          color: #000;`r`n        }`r`n`r`n        .label-client {"
$content = $content.Replace($badBlock, $goodBlock)

# Fix label-phone color #bbb -> #333
$old = "          color: #bbb;`r`n        }`r`n`r`n        .label-qr {"
$new = "          color: #333;`r`n        }`r`n`r`n        .label-qr {"
$content = $content.Replace($old, $new)

Set-Content $file $content -NoNewline
Write-Host "Fixed!"
