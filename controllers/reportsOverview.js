const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");
const { report } = require("../routes");
const e = require("express");

//THIS IS ALL THE STUFF FOR THE REPORTING OVERVIEW AND DATA PAGE

exports.reportsOverviewPage = async (req, res, next) => {

    /*const [row] = await dbConnection.execute("SELECT * FROM `accounts` WHERE `id`=?", [req.session.userID]);
    const [reports] = await dbConnection.execute("SELECT * FROM `form_data` WHERE (`submitter_id`=?) OR (`helper_id`=?)", [req.session.userID, req.session.userID]);
    var mainReports = [];
    const [empanadas] = await dbConnection.execute("SELECT id, empanada_name FROM `empanadas`");
    const [markets] = await dbConnection.execute("SELECT id, market_name FROM `markets`");
    const [people] = await dbConnection.execute("SELECT * FROM `accounts`");
    */
    console.log("Creating render for the reports page");

    res.render('reports_overview', {
        
    });
}