::===============================================================
:: To make this work, install Docker Desktop first from:
:: https://docs.docker.com/get-docker/
::===============================================================

docker system prune
docker stop lbdbackend
docker stop graph-db
docker stop mongo

docker rm lbdbackend
docker rm graph-db
docker rm mongo
pause