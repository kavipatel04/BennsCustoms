const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");


// Home Page
exports.homePage = async (req, res, next) => {
    const [row] = await dbConnection.execute("SELECT * FROM `accounts` WHERE `id`=?", [req.session.userID]);
    const [empanadas] = await dbConnection.execute("SELECT * FROM `empanadas`");
    const [markets] = await dbConnection.execute("SELECT * FROM `markets`");
    const [helpers] = await dbConnection.execute("SELECT * FROM `accounts` WHERE `id`!=?", [req.session.userID]);
    let marketsDict = Object.assign({}, ...markets.map((x) => ({[x.id]: x.market_name})));
    let empanadaDict = Object.assign({}, ...empanadas.map((x) => ({[x.id]: x.empanada_name})));
    if (row.length !== 1) {
        return res.redirect('/logout');
    }

    if (req.session.reportSuccessStatus != "no status"){
        req.session.reportStatusDone += 1;
    }
    if (req.session.reportFailedStatus != "no status"){
        req.session.reportStatusDone += 1;
    }

    if (req.session.reportStatusDone > 1){
        req.session.reportSuccessStatus = "no status";
        req.session.reportFailedStatus = "no status";
    }

    
    res.render('home', {
        user: row[0],
        myEmpanadas: empanadas,
        myMarkets: markets,
        myHelpers: helpers,
        session: req.session,
        myMarketsDict: marketsDict,
        myEmpanadasDict: empanadaDict
    });
   

    
}

// Register Page
exports.registerPage = (req, res, next) => {
    res.render("register");
};

//Creating the reports page
exports.reportsPage = async (req, res, next) => {

    const [row] = await dbConnection.execute("SELECT * FROM `accounts` WHERE `id`=?", [req.session.userID]);
    const [reports] = await dbConnection.execute("SELECT * FROM `form_data` WHERE (`submitter_id`=?) OR (`helper_id`=?)", [req.session.userID, req.session.userID]);
    var mainReports = [];
    const [empanadas] = await dbConnection.execute("SELECT id, empanada_name FROM `empanadas`");
    const [markets] = await dbConnection.execute("SELECT id, market_name FROM `markets`");
    const [people] = await dbConnection.execute("SELECT * FROM `accounts`");
    

    for (var k=0; k<reports.length; k++){
        const [empanadaReports] = await dbConnection.execute("SELECT * FROM `empanada_data` WHERE (`report_id`=?)", [reports[k]["report_id"]]);
        mainReports.push(empanadaReports);
    }

    if (row.length !== 1) {
        return res.redirect('/logout');
    }
    let empanadaDict = Object.assign({}, ...empanadas.map((x) => ({[x.id]: x.empanada_name})));
    let marketsDict = Object.assign({}, ...markets.map((x) => ({[x.id]: x.market_name})));
    let peopleDict = Object.assign({}, ...people.map((x) => ({[x.id]: x.name})));
   

    res.render('reports', {
        user: row[0],
        myReports: reports,
        myMainReports: mainReports,
        myEmpanadas: empanadaDict,
        myMarkets: marketsDict,
        myPeople: peopleDict
    });
}

exports.empanadaRequestPage = async (req, res, next) => {

    const [row] = await dbConnection.execute("SELECT * FROM `accounts` WHERE `id`=?", [req.session.userID]);
    const [reports] = await dbConnection.execute("SELECT * FROM `form_data` WHERE (`submitter_id`=?) OR (`helper_id`=?)", [req.session.userID, req.session.userID]);
    var mainReports = [];
    const [empanadas] = await dbConnection.execute("SELECT id, empanada_name FROM `empanadas`");
    const [markets] = await dbConnection.execute("SELECT id, market_name FROM `markets`");
    const [people] = await dbConnection.execute("SELECT * FROM `accounts`");
    

    for (var k=0; k<reports.length; k++){
        const [empanadaReports] = await dbConnection.execute("SELECT * FROM `empanada_data` WHERE (`report_id`=?)", [reports[k]["report_id"]]);
        mainReports.push(empanadaReports);
    }

    if (row.length !== 1) {
        return res.redirect('/logout');
    }
 

    res.render('empanada_request_page', {
        user: row[0],
        myReports: reports,
        myMainReports: mainReports,
        myEmpanadas: empanadas,
        myMarkets: markets,
        myPeople: people
    });
}

// User Registration
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;

    if (!errors.isEmpty()) {
        return res.render('register', {
            error: errors.array()[0].msg
        });
    }

    try {

        const [row] = await dbConnection.execute(
            "SELECT * FROM `accounts` WHERE `email`=?",
            [body._email]
        );

        if (row.length >= 1) {
            return res.render('register', {
                error: 'This email already in use.'
            });
        }

        const hashPass = await bcrypt.hash(body._password, 12);

        const [rows] = await dbConnection.execute(
            "INSERT INTO `accounts`(`name`,`email`,`password`) VALUES(?,?,?)",
            [body._name, body._email, hashPass]
        );

        if (rows.affectedRows !== 1) {
            return res.render('register', {
                error: 'Your registration has failed.'
            });
        }
        
        res.render("register", {
            msg: 'You have successfully registered.'
        });

    } catch (e) {
        next(e);
    }
};

// Login Page
exports.loginPage = (req, res, next) => {
    res.render("login");
};

// Login User
exports.login = async (req, res, next) => {

    const errors = validationResult(req);
    const { body } = req;

    if (!errors.isEmpty()) {
        return res.render('login', {
            error: errors.array()[0].msg
        });
    }
    req.session.reportSuccessStatus = "no status";
    req.session.reportFailedStatus = "no status";
    try {

        const [row] = await dbConnection.execute('SELECT * FROM `accounts` WHERE `email`=?', [body._email]);
        if (row.length != 1) {
            return res.render('login', {
                error: 'Invalid email address.'
            });
        }
        const checkPass = await bcrypt.compare(body._password, row[0].password);
        if (checkPass === true) {
            req.session.userID = row[0].id;
            return res.redirect('/');
        }
        res.render('login', {
            error: 'Invalid Password.'
        });
    }
    
    catch (e) {
        next(e);
    }

}


