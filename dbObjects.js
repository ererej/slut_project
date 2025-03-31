const Sequelize = require('sequelize');
const config = require('./config.json');
const dbcredentoiols = process.argv.includes("--productiondb") || process.env.DATABASE === 'productiondb' ? config.productionDb : config.db;

console.log("Connecting to database: " + dbcredentoiols.database)
const sequelize = new Sequelize(dbcredentoiols.database, dbcredentoiols.username, dbcredentoiols.password, {
	host: dbcredentoiols.host,
	dialect: 'mysql',
	logging: false,
});


 
const Tricks = require('./models/Tricks')(sequelize, Sequelize.DataTypes); 
const Users = require('./models/Users')(sequelize, Sequelize.DataTypes);



const models = { Sequelize, Tricks, Users };

Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});

/*
const getRaw = (trick) => {
	const rawTrick = new Tricks();
	if (!trick) {
		return undefined;
	}
	if (!trick.dataValues) {
		return undefined;
	}

	Object.keys(trick.dataValues).forEach(key => {
		if (key === 'from' || key === 'to') {
			if (trick[key]) {
				rawTrick[key] = getRaw(trick[key]);
			} else {
				rawTrick[key] = null;
			}
		}
		rawTrick[key] = trick[key];
	});
	return rawTrick;
};
*/
/*
Reflect.defineProperty(Tricks.prototype, 'raw', {
	value: function() {

		//return getRaw(this)

		const trick = new Tricks();

		Object.keys(this.dataValues).forEach(key => {
			if (key === 'from' || key === 'to') {
				if (this[key]) {
					trick[key] = new Tricks(this[key]).raw();
				} else {
					trick[key] = null;
				}
			}
			trick[key] = this[key];
		});
		return trick;
	}	
});
*/

module.exports = models;