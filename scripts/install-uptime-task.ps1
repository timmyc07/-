# Registers a local probe for the current Windows user.
$ErrorActionPreference = 'Stop'
$taskName = 'StudyGo-Uptime'
$probe = @(
    '$ErrorActionPreference = ''Stop'''
    '$uri = ''https://studygo-a49h.onrender.com/taichung-library-logo.svg?check='' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()'
    '$response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 75 -Headers @{ ''Cache-Control'' = ''no-cache'' }'
    'if ($response.StatusCode -ne 200 -or $response.Headers[''Content-Type''] -notlike ''image/svg+xml*'') { throw ''StudyGo did not return the expected SVG.'' }'
) -join '; '

$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$action = New-ScheduledTaskAction -Execute $powershell -Argument ('-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -Command "' + $probe + '"')
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings `
    -Description 'Check the public StudyGo endpoint every five minutes.' -Force
