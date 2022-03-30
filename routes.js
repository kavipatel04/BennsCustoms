const router = require("express").Router();
const express = require("express");
const { body } = require("express-validator");
const res = require("express/lib/response");
const { redirect } = require("express/lib/response");
const { check, validationResult } = require("express-validator/check");

const {
    homePage,
    register,
    registerPage,
    login,
    loginPage,
    reportsPage,
    empanadaRequestPage
} = require("./controllers/userController");

const {
    formSubmit,
    empanadaRequestFormSubmit,
    retrievePackagerData,
    packagerFormSubmit
} = require("./controllers/formController");


const {
    reportsOverviewPage
} = require("./controllers/reportsOverview");

const ifNotLoggedin = (req, res, next) => {
    if(!req.session.userID){
        return res.redirect('/login');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.userID){
        return res.redirect('/');
    }
    next();
}

router.get('/', ifNotLoggedin, homePage);

router.get("/login", ifLoggedin, loginPage);
router.post("/login",
ifLoggedin,
    [
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    login
);

router.get("/signup", ifLoggedin, registerPage);
router.post(
    "/signup",
    ifLoggedin,
    [
        body("_name", "The name must be of minimum 3 characters length")
            .notEmpty()
            .escape()
            .trim()
            .isLength({ min: 3 }),
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    register
);


// Access the parse results as request.body
/*
router.post('/FormData', function(request, response){
    console.log(request.body._ex_text);
    console.log(request.body._emp_name);
    response.redirect('back');
});
*/
router.get("/reports", ifNotLoggedin, reportsPage);



router.get("/FormData", homePage);
router.post(
    "/FormData",
    [
    
        body("report_for_date", "Need to provide a service date").isDate(),
    ],
    formSubmit
);

//this is to get the empanada request form
router.get("/EmpanadaRequest", ifNotLoggedin, empanadaRequestPage);

router.get("/EmpanadaRequestFormData", homePage);
router.post(
    "/EmpanadaRequestFormData",
    [
        body("_fm_date", "Need to provide a service date").isDate(),
    ],
    empanadaRequestFormSubmit
);

//this is to make the reports overview page
router.get("/ReportsOverview", ifNotLoggedin, reportsOverviewPage);

//this is to get the packager data
router.get("/RetrievePackagerData", homePage);
router.post(
    "/RetrievePackagerData",
    [
        body("_fm_date", "Need to provide a service date").notEmpty()
        .escape()
        .trim()
        .isDate(),
    ],
    retrievePackagerData
);

//this is to submit the packager form
router.get("/PackagerFormData", homePage);
router.post(
    "/PackagerFormData",
    [
        
    ],
    packagerFormSubmit
);


router.get('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        next(err);
    });
    res.redirect('/login');
});




module.exports = router;