@echo off
rem Builds dist\ and lists the files to upload. Add --local to also refresh C:\Apache24\htdocs\outreach\holidays.
cd /d "%~dp0"
python build.py %*
pause
