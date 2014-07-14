// registry/signup.js

/*
 * Copyright (c) 2014
 *     Nexa Center for Internet & Society, Politecnico di Torino (DAUIN),
 *     Alessio Melandri <alessiom92@gmail.com> and
 *     Simone Basso <bassosimone@gmail.com>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//
// Handles the /signup and the /reset requests
//

/*jslint node: true */
"use strict";

var backend = require("./backend.js");
var crypto = require("crypto");
var fs = require("fs");
var mailer = require("./mailer.js");
var utils = require("./utils.js");

//
// Invoked when the student navigates to the '/signup' URL. Returns
// the page that allows one to signup.
//
exports.servePage = function (request, response) {
    utils.servePath__("/html/signup.html", response);
};

//
// Invoked when the student sends us his/her matricola. Checks whether
// the student exists and, if so, asks he/she to confirm his/her identity.
//
exports.handleMatricola = function (request, response) {

    // Fill and send the studentInfo template
    function fillAndSendTemplate(matricola, stud) {
        fs.readFile("./html/signup.tpl.html", "utf8", function (error, data) {
            var long_name = stud.Cognome + ", " + stud.Nome;
            console.info("signup: SEND_TEMPLATE");
            data = data.replace(/@MATRICOLA@/g, matricola);
            data = data.replace(/@NOME@/g, long_name);
            utils.writeHeadVerboseCORS(response, 200, {
                "Content-Type": "text/html"
            });
            response.write(data);
            response.end();
        });
    }

    // If needed, generates a new token and sends the template back
    function possiblySendTemplate(matricola) {

        console.info("signup: possiblySendTemplate");

        backend.readStudentInfo(matricola,
            function (error, studentInfo) {
                console.info(
                    "signup: possiblySendTemplate after readStudentInfo"
                );

                if (error) {
                    utils.internalError(error, request, response);
                    return;
                }

                try {
                    studentInfo.Token = crypto.randomBytes(20).toString("hex");
                    delete studentInfo.Matricola;
console.info(matricola, studentInfo, studentInfo.Token);
                } catch (error) {
                    utils.internalError(error, request, response);
                    return;
                }

                backend.writeStudentInfo(matricola, studentInfo, function (error) {

                    console.info(
                        "signup: possiblySendTemplate after writeStudentInfo"
                    );

                    if (error) {
                        utils.internalError(error, request, response);
                        return;
                    }
                    fillAndSendTemplate(matricola, studentInfo);
                });
            });
    }

    // Creates the user file and send template
    function createFileAndSendToken(matricola, cognome, nome) {

        console.info("signup: createFileAndSendToken");

        backend.writeStudentInfo({
                "Nome": nome,
                "Cognome": cognome,
                "Matricola": matricola,
                "Token": "",
                "Blog": "",
                "Twitter": "",
                "Wikipedia": "",
                "Video": "",
                "Post1": "",
                "Post2": "",
                "Post3": ""
            },
            function (error) {
                if (error) {
                    utils.internalError(error, request, response);
                    return;
                }
                possiblySendTemplate(matricola);
            });
    }

    utils.readBodyJSON(request, response, function (message) {
        var matricola = message.Matricola;
        var checkData = message;
        delete checkData.Matricola;
        if (!backend.hasValidKeys(checkData) ||
            message.Token !== undefined || !backend.validMatricola(matricola)
        ) {
            utils.internalError("signup: invalid argument", request, response);
            return;
        }
        fs.readFile("/etc/rivoluz/iscritti.json", "utf8", function (error, data) {
            var i, vector;

            if (error) {
                utils.internalError(error, request, response);
                return;
            }

            vector = utils.safelyParseJSON(data);
            if (vector === null) {
                utils.internalError(
                    "signup: students database parsing error",
                    request, response);
                return;
            }

            console.info("signup: VALID_STUDENTS_DATA");

            //
            // XXX: here we may want to organize the students database
            // by matricola to have O(1) lookup (rather than O(n)).
            //
            for (i = 0; i < vector.length; i++) {
                if (vector[i].MATRICOLA === matricola) {
                    break;
                }
            }
            if (i === vector.length) {
                utils.internalError("signup: matricola not found",
                    request, response);
                return;
            }

            console.info("signup: FOUND_STUDENT");

            fs.exists("/var/lib/rivoluz/s" + matricola + ".json",
                function (exists) {
                    if (!exists) {
                        createFileAndSendToken(matricola, vector[i].COGNOME,
                            vector[i].NOME);
                    } else {
                        possiblySendTemplate(matricola);
                    }
                });
        });
    });

};

//
// Invoked when the student confirms that his/her data is correct; should
// run the mailer to communicate to the user the token.
//
exports.handleConfirm = function (request, response) {
    utils.readBodyJSON(request, response, function (message) {
        var matricola = message.Matricola;
        var checkData = message;
        delete checkData.Matricola;
        if (!backend.hasValidKeys(checkData) ||
            message.Token !== undefined || !backend.validMatricola(matricola)
        ) {
            utils.internalError("signup: invalid argument", request, response);
            return;
        }

        console.info("signup: sending email to %s", matricola);
        mailer.sendToken(matricola, function (error) {
            if (error) {
                utils.internalError(error, request, response);
                return;
            }
            // Send empty JSON to avoid "no element found" browser warning
            utils.writeHeadVerboseCORS(response, 200, {
                "Content-Type": "application/json"
            });
            response.write("{}");
            response.end();
        });
    });
};
