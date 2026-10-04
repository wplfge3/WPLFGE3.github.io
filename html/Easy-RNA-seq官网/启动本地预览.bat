@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   Easy-RNA-seq 官网 · 本地预览
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    set "PY=python"
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set "PY=py"
    ) else (
        echo [提示] 未检测到 Python，将直接用默认浏览器打开 index.html。
        echo        直接双击打开也能正常浏览，只是「复制联系方式」按钮
        echo        在部分浏览器下需要手动选择复制。
        echo.
        start "" "index.html"
        pause
        exit /b 0
    )
)

set "PORT=8080"
echo 正在启动本地服务器： http://127.0.0.1:%PORT%/
echo 关闭本窗口即可停止服务器。
echo.

start "" "http://127.0.0.1:%PORT%/"
%PY% -m http.server %PORT% --bind 127.0.0.1
endlocal
