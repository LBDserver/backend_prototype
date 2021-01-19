::===============================================================
:: To make this work, install Docker Desktop first from:
:: https://docs.docker.com/get-docker/
::===============================================================
echo off
echo You need to have Docker Desktop installed and running
echo This overwrites dev.env
echo Press Cntr-c to stop
echo Enter to continue
pause
copy ..\\..\\config\\dev.env ..\\..\\config\\dev.env.bak
copy dev.env  ..\\..\\config
copy .dockerignore ..\\..
copy dockerfile ..\\..
start /max http://localhost:5000/docs/
docker-compose up
pause