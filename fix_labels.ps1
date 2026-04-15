$file = 'c:\os_manager_moded\src\components\os\print\printOS.ts'
$content = Get-Content $file -Raw

# In OSA4Dual: Fix label-client color from #bbb to #333
$old1 = "          color: #bbb;" + [char]13 + [char]10 + "          word-wrap: break-word;"
$new1 = "          color: #333;" + [char]13 + [char]10 + "          word-wrap: break-word;"
$content = $content.Replace($old1, $new1)

# In OSA4Dual: Remove border from label-qr (only in A4Dual, which has "crossorigin" nearby)
$old2 = "          margin-left: 2mm;" + [char]13 + [char]10 + "          border: 1px solid #eee;" + [char]13 + [char]10 + "        }" + [char]13 + [char]10 + [char]13 + [char]10 + "        @media print {"
$new2 = "          margin-left: 2mm;" + [char]13 + [char]10 + "        }" + [char]13 + [char]10 + [char]13 + [char]10 + "        @media print {"
$content = $content.Replace($old2, $new2)

# Fix Gabarito * selector (broken, apply correct CSS reset)
$oldGab = "      <style>" + [char]13 + [char]10 + "        * {" + [char]13 + [char]10 + "          padding: 3mm;" + [char]13 + [char]10 + "          box-sizing: border-box;" + [char]13 + [char]10 + "          display: flex;" + [char]13 + [char]10 + "          align-items: center;" + [char]13 + [char]10 + "          justify-content: space-between;" + [char]13 + [char]10 + "          background: #fff;" + [char]13 + [char]10 + "        }"
$newGab = "      <style>" + [char]13 + [char]10 + "        * {" + [char]13 + [char]10 + "          margin: 0;" + [char]13 + [char]10 + "          padding: 0;" + [char]13 + [char]10 + "          box-sizing: border-box;" + [char]13 + [char]10 + "        }" + [char]13 + [char]10 + [char]13 + [char]10 + "        body {" + [char]13 + [char]10 + "          font-family: Arial, Helvetica, sans-serif;" + [char]13 + [char]10 + "          font-size: 10px;" + [char]13 + [char]10 + "          color: #333;" + [char]13 + [char]10 + "          padding: 8mm 12mm !important;" + [char]13 + [char]10 + "          max-width: 210mm;" + [char]13 + [char]10 + "          margin: 0 auto;" + [char]13 + [char]10 + "          position: relative;" + [char]13 + [char]10 + "        }" + [char]13 + [char]10 + [char]13 + [char]10 + "        .labels-container {" + [char]13 + [char]10 + "          position: fixed;" + [char]13 + [char]10 + "          bottom: 12mm;" + [char]13 + [char]10 + "          left: 0;" + [char]13 + [char]10 + "          right: 0;" + [char]13 + [char]10 + "          display: flex;" + [char]13 + [char]10 + "          gap: 15mm;" + [char]13 + [char]10 + "          justify-content: center;" + [char]13 + [char]10 + "          page-break-inside: avoid;" + [char]13 + [char]10 + "        }" + [char]13 + [char]10 + [char]13 + [char]10 + "        .equipment-label {" + [char]13 + [char]10 + "          width: 50mm;" + [char]13 + [char]10 + "          height: 30mm;" + [char]13 + [char]10 + "          border: 1px dashed #666;" + [char]13 + [char]10 + "          padding: 3mm;" + [char]13 + [char]10 + "          box-sizing: border-box;" + [char]13 + [char]10 + "          display: flex;" + [char]13 + [char]10 + "          align-items: center;" + [char]13 + [char]10 + "          justify-content: space-between;" + [char]13 + [char]10 + "          background: #fff;" + [char]13 + [char]10 + "        }"
$content = $content.Replace($oldGab, $newGab)

Set-Content $file $content -NoNewline
Write-Host "Done!"
