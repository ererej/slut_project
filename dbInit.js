const Sequelize = require('sequelize');
const config = require('./config.json');
dbcredentoiols = config.db;
const sequelize = new Sequelize(dbcredentoiols.database, dbcredentoiols.username, dbcredentoiols.password, {
	host: dbcredentoiols.host,
	dialect: 'mysql',
	logging: false,
});


require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/Tricks.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	

	// await Promise.all(shop); 
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');

	
}).catch(console.error);

const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ alter }).then(async () => {
	sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
		console.log('// Tables in database','==========================');
		console.log(tableObj);
	})
	console.log('Database synced');
}).catch(console.error);