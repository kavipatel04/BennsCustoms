const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");
const { report } = require("../routes");
const e = require("express");




exports.formSubmit = async (req, res, next) => {
    console.log("Form Submitted");
    const { body } = req;
    var reportID = Date.now();
    console.log(reportID);
    var reportCompleteSuccessfully = true;

    var card_tips = body["_card_tips"];
    var cash_in = body["_cash_in"];
    
    if (card_tips == ""){
        card_tips = 0;
    } 
    if (cash_in == ""){
        cash_in = 0;
    }
    try {
        var myDate = body["report_for_date"];
        
        console.log(typeof myDate);
        const [empanadas] = await dbConnection.execute("SELECT * FROM `empanadas`");
        const [form_rows] = await dbConnection.execute(
            "INSERT INTO `form_data`(`report_id`,`market_id`,`submitter_id`, `helper_id`, `cash_in`, `card_tips`, `report_date`) VALUES(?,?,?,?,?,?,?)",
            [reportID, body["_market_id"], body["_submitter_id"], body["_helper_id"], cash_in, card_tips, myDate]
        );
        if (form_rows.length <= 0) {
            reportCompleteSuccessfully = false;
        }
        

        for (i = 0; i < empanadas.length; i++) {
            var myEmpanada = empanadas[i]
            var myEmpanadaName = myEmpanada["empanada_name"];
            var myEmpanadaID = myEmpanada["id"];
            var freshEmpanada = body["_empanada_" + myEmpanadaName + "_fresh"]
            var thrownEmpanada = body["_empanada_" + myEmpanadaName + "_thrown"]
            
            if (freshEmpanada == ""){
                freshEmpanada = 0;
            } 
            if (thrownEmpanada == ""){
                thrownEmpanada = 0;
            }

            const [rows] = await dbConnection.execute(
                "INSERT INTO `empanada_data`(`report_id`,`empanada_id`,`empanada_quantity_fresh`, `empanada_quantity_thrown`) VALUES(?,?,?,?)",
                [reportID, myEmpanadaID, freshEmpanada, thrownEmpanada]
            );
            
                        
        } 
    } catch {
        reportCompleteSuccessfully = false;
    }  

    if (reportCompleteSuccessfully){
        req.session.reportSuccessStatus = "Your report has been submitted successfully. Report ID is " + reportID;
        req.session.reportStatusDone = 0;
        req.session.reportFailedStatus = "no status";
    } else {
        req.session.reportFailedStatus = "Your report has failed. Check internet!";
        req.session.reportStatusDone = 0;
        req.session.reportSuccessStatus = "no status";
    }

   res.redirect("/");
};

exports.empanadaRequestFormSubmit = async (req, res, next) => {
    const { body } = req;
    var packageID = Date.now();
    
    const [package_row] = await dbConnection.execute("SELECT * FROM `package_form_data` WHERE `fm_date`=? AND `market_id`=?", [body["_fm_date"], body["_market_id"] ]);

    var isNotDuplicate = (package_row.length <= 0);
    if (isNotDuplicate){
        const [empanadas] = await dbConnection.execute("SELECT * FROM `empanadas`");
        const [form_rows] = await dbConnection.execute(

            "INSERT INTO `package_form_data`(`package_id`,`fm_date`,`market_id`, `submitter_id`) VALUES(?,?,?,?)",
            [packageID, body["_fm_date"], body["_market_id"], body["_submitter_id"]]
        );
        for (i = 0; i < empanadas.length; i++) {
            var myEmpanada = empanadas[i]
            var myEmpanadaName = myEmpanada["empanada_name"];
            var myEmpanadaID = myEmpanada["id"];
            var empanadaRequested = body["_empanada_" + myEmpanadaName + "_to_package"]
            
            if (empanadaRequested == ""){
                empanadaRequested = 0;
            } 
            const [rows] = await dbConnection.execute(
                "INSERT INTO `packed_empanada_data`(`package_id`,`empanada_id`,`empanada_requested`) VALUES(?,?,?)",
                [packageID, myEmpanadaID, empanadaRequested]
            );
                        
        } 
        
    } else {
      
            const [empanadas] = await dbConnection.execute("SELECT * FROM `empanadas`");
            const [form_rows] = await dbConnection.execute(

                "UPDATE `package_form_data` SET `submitter_id`=? WHERE `package_id`=?",
                [body["_submitter_id"], package_row[0].package_id]
            );
            
            for (i = 0; i < empanadas.length; i++) {
                var myEmpanada = empanadas[i]
                var myEmpanadaName = myEmpanada["empanada_name"];
                var myEmpanadaID = myEmpanada["id"];
                var empanadaRequested = body["_empanada_" + myEmpanadaName + "_to_package"]
                
                if (empanadaRequested == ""){
                    empanadaRequested = 0;
                } 
                const [rows] = await dbConnection.execute(
                    "UPDATE `packed_empanada_data` SET `empanada_requested` = ? WHERE  `empanada_id` = ? AND `package_id`=?",
                    [empanadaRequested, myEmpanadaID, package_row[0].package_id]
                );
                            
            }
        
        
        
    }
    res.redirect("/EmpanadaRequest");
};


exports.retrievePackagerData = async (req, res, next) => {
    const { body } = req;

    var todaysDate = new Date();
    todaysDate.setHours(0, 0, 0, 0);
    var inputDateOBJ = new Date(body["_fm_date"]);
    var processRequest = (inputDateOBJ.getTime() >= todaysDate.getTime()-86400000);
    
    //if we are allowed to process the request, then proceed with the try catch
    if (processRequest){
        const [package_row] = await dbConnection.execute("SELECT * FROM `package_form_data` WHERE `fm_date`=? AND `market_id`=?", [body["_fm_date"], body["_market_id"] ]);
        
        
        try {
            var packageID = package_row[0].package_id;
            const [packed_empanadas] = await dbConnection.execute("SELECT empanada_id, empanada_requested FROM `packed_empanada_data` WHERE `package_id`=?", [packageID]);
            let packedEmpDict = Object.assign({}, ...packed_empanadas.map((x) => ({[x.empanada_id]: x.empanada_requested})));
            console.log(packedEmpDict);
            
            req.session.requestedEmpDict = packedEmpDict;
            req.session.reportSuccessStatus = "Successfully pulled data for " + body["_fm_date"];
            req.session.reportStatusDone = 0;
            req.session.reportFailedStatus = "no status";
            req.session.startPackerForm = true;
            req.session.packerMarketID = package_row[0].market_id;
            
        } catch (e) {
            console.log("there has been an error in trying to get the data");
            console.error(e, e.stack);
            req.session.reportSuccessStatus = "no status";
            req.session.reportStatusDone = 0;
            req.session.reportFailedStatus = "Unable to pull data for that date and farmers market";
            req.session.startPackerForm = undefined;
        }

        
    } else{
        req.session.reportSuccessStatus = "no status";
        req.session.reportStatusDone = -1;
        req.session.reportFailedStatus = "Unable to pull up packaging form for previous dates. Please contact Nacho with this error.";
        req.session.requestedEmpDict = undefined;
        req.session.startPackerForm = undefined;
        req.session.otherActiveFM = undefined;
        
    }

    const [otherActiveFarmersMarkets] = await dbConnection.execute("SELECT market_id FROM `package_form_data` WHERE `fm_date`=?", [body["_fm_date"]]);

    if (otherActiveFarmersMarkets.length >= 1){
        req.session.otherActiveFM = otherActiveFarmersMarkets;
        console.log(req.session.otherActiveFM);
    } else {
        req.session.otherActiveFM = undefined;
    }
    req.session.date = body["_fm_date"];
   res.redirect("/");
};

exports.packagerFormSubmit = async (req, res, next) => {
    var myDate = new Date();
    myDate = myDate.toString();
    const { body } = req;
    try {
        const [empanadas] = await dbConnection.execute("SELECT * FROM `empanadas`");
        const [package_row] = await dbConnection.execute("SELECT * FROM `package_form_data` WHERE `fm_date`=? AND `market_id`=?", [req.session.date, req.session.packerMarketID]);
        
        
        for (i = 0; i < empanadas.length; i++) {
            var myEmpanada = empanadas[i]
            var myEmpanadaName = myEmpanada["empanada_name"];
            var myEmpanadaID = myEmpanada["id"];
            var empanadaPacked = body["_empanada_" + myEmpanadaName + "_packaged"]
            
            if (empanadaPacked == ""){
                empanadaPacked = 0;
            } 
            const [rows] = await dbConnection.execute(
                "UPDATE `packed_empanada_data` SET `empanada_packed` = ?, packer_submitter_id=?, `empanada_packed_edit`=?  WHERE  `empanada_id` = ? AND `package_id`=?",
                [empanadaPacked, req.session.userID,myDate, myEmpanadaID, package_row[0].package_id]
            );
                        
        }
        req.session.reportSuccessStatus = "Successfully submitted your packaging report. Package Report ID " + package_row[0].package_id;
        req.session.reportStatusDone = 0;
        req.session.reportFailedStatus = "no status";
    
    } catch {
        req.session.reportSuccessStatus = "no status";
        req.session.reportStatusDone = -1;
        req.session.reportFailedStatus = "Potentially unable to add your packaging report. Please contact nacho and tell him about this error.";
    }

    req.session.packerMarketID = undefined;
    req.session.date = undefined;
    req.session.requestedEmpDict = undefined;
    req.session.startPackerForm = undefined;
    req.session.otherActiveFM = undefined;


    res.redirect("/");
};
