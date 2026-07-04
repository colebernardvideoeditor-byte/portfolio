$ErrorActionPreference = "Stop"
$gitRoot = "C:\Users\solic\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git"
$env:PATH = "$gitRoot\mingw64\bin;$gitRoot\cmd;$env:PATH"
$env:GIT_EXEC_PATH = "$gitRoot\mingw64\bin"
& "$gitRoot\cmd\git.exe" -c http.sslBackend=openssl push -u origin main
