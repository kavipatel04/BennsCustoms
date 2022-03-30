const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const dbConnection = mysql.createPool({
    host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWD,
	database : process.env.DB_DB
});

module.exports = dbConnection.promise();