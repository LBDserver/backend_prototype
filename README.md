# Getting started with the LBDserver backend

## Prerequisites
* Make sure you have [nodejs and npm](https://nodejs.org/en/download/) installed.
* The backend communicates with different databases at the same time. You need to install [MongoDB](https://www.mongodb.com/try/download/community?tck=docs_server) and [GraphDB](https://www.ontotext.com/products/graphdb/graphdb-free/).
* (Optional) Create a dedicated folder for all your LBDserver downloads.

## Installation
* (option 1a: using [git](https://git-scm.com/download)) - run `git clone https://github.com/LBDserver/front-react.git` in your favourite terminal, in your favourite folder.
* (option 1b: using ZIP folders) - Go to the CODE button at the top of the repository and click `Download ZIP`. Extract the folder.
* Once the repository is extracted, run `npm install` to install the necessary modules.
* Create a dev.env file in the `>config` directory, and copy the items from `dev.env.template`. You can change ports, token secrets, admin configuration etc. in this .dev file. 

## Startup
* Start both [MongoDB](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/) and GraphDB. By default they will run respectively on port 27017 and port 7200.
* Run the command `npm run dev` in a terminal (in the folder where you installed this repository)
* The application will be hosted on port 3000. You may find it at http://localhost:3000.

## API
* Api documentation coming soon!