INSTRUCTIONS FOR SETTING UP WEBSITE

open folder containing the project, use bash and if node is installed, type npm install to install the dependencies and modules listed in the package.json file (even though all the modules are already provided, just in case).

Once the modules have been set up, there needs to be a mongo DB database created on your machine called blogmachine for that is the name of the local database my website connects to. To achieve this, let's say MongoDB's install folder was in your C:\ drive.

cd C:\MongoDb\bin

then you open a cmd in the bin folder and type

->mongo

That should let you enter the mongo console, once you are in the mongo console, all you have to type to create the database is

-> use blogmachine

this will create the db.
