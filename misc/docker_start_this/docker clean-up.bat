::===============================================================
:: To make this work, install Docker Desktop first from:
:: https://docs.docker.com/get-docker/
::===============================================================

docker system prune
docker stop lbdbackend
docker stop graphdb
docker stop mongo

docker rm lbdbackend
docker rm graphdb
docker rm mongo
pause