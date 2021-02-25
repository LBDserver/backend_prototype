# Getting started with the LBDserver backend

## Prerequisites
* Make sure you have [nodejs and npm](https://nodejs.org/en/download/) installed.
* The backend communicates with different databases at the same time. You need to install [MongoDB](https://www.mongodb.com/try/download/community?tck=docs_server) and [GraphDB](https://www.ontotext.com/products/graphdb/graphdb-free/).
* (Optional) Create a dedicated folder for all your LBDserver downloads.

## Installation
* (option 1a: using [git](https://git-scm.com/download)) - run `git clone https://github.com/LBDserver/backend_prototype.git` in your favourite terminal, in your favourite folder.
* (option 1b: using ZIP folders) - Go to the CODE button at the top of the repository and click `Download ZIP`. Extract the folder.
* Once the repository is extracted, run `npm install` to install the necessary modules.
* Create a dev.env file in the `>config` directory, and copy the items from `dev.env.template`. You can change ports, token secrets, admin configuration etc. in this .dev file. 

## Folder setup
* After installing this backend from the above step, proceed to also install the frontend from the main LDBServer repo.
* Please place these two folders as below:
    .
    ├── front-react                   # frontend from the main LBDServer repo
    └── backend_prototype            # backend from the main LDBServer repo

## Startup
* Start both [MongoDB](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/) and GraphDB. By default they will run respectively on port 27017 and port 7200.
* Run the command `npm run dev` in a terminal (in the folder where you installed this repository). Since concurrently is installed, this command will simultaneously start both the frontend and backend (Please ensure that you follow the folder structure as mentioned above)
* The application will be hosted on port 5000. You may find it at http://localhost:5000.


## Startup
* Start both [MongoDB](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/) and GraphDB. By default they will run respectively on port 27017 and port 7200.
* Run the command `npm run dev` in a terminal (in the folder where you installed this repository)
* The application will be hosted on port 5000. You may find it at http://localhost:5000.

## API
* The OpenAPI specifications are automatically generated and available on "http://localhost:5000/docs". However, it is recommended to use the higher level functions provided in the npm package ["lbd-server"](https://www.npmjs.com/package/lbd-server), which are are documented at the [LBDserver API github repository](https://github.com/LBDserver/API).
