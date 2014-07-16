// registry/router.js

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

/*jslint node: true */
"use strict";

var annotate = require("./annotate");
var login = require("./login.js");
var login_once = require("./login_once.js");
var logout = require("./logout.js");
var mailer = require("./mailer.js");
var post = require("./post");
var signup = require("./signup.js");
var url = require("url");
var utils = require("./utils.js");

var router = {
    "/": function (request, response) {
        utils.servePath__("/html/index.html", response);
    },

    "/jquery.md5.min.js": function (request, response) {
        utils.servePath__("/js/jquery.md5.min.js", response,
          "text/javascript");
    },
    "/annotator-full.min.js": function (request, response) {
        utils.servePath__("/js/annotator-full.min.js", response,
          "text/javascript");
    },
    "/annotator.min.css": function (request, response) {
        utils.servePath__("/css/annotator.min.css", response,
          "text/css");
    },
    "/main_style.css": function (request, response) {
        utils.servePath__("/css/main_style.css", response,
          "text/css");
    },
    "/logo-rd-small.png": function (request, response) {
        utils.servePath__("/img/logo-rd-small.png", response,
          "text/css");
    },

    "/login": login.handleRequest,
    "/mod_sent": login.modPage,
    "/logout": logout.handleRequest,

    "/signup": signup.servePage,
    "/reset": signup.servePage,
    "/matr_sent": signup.handleMatricola,
    "/confirm_sent": signup.handleConfirm,
    "/login_once": login_once.servePage,
    "/token_sent": login_once.handleToken
};

exports.handleRequestSSL = function (request, response) {

    utils.logRequest(request);

    if (request.method === "OPTIONS") {
        utils.writeHeadVerboseCORS(response, 200);
        response.end();
        return;
    }

    if (request.url.indexOf("/annotate/", 0) === 0) {
        annotate.handleRequest(request, response);
        return;
    }

    //
    // We must serve /post/annotate/ over https, otherwise the browser
    // does not pick up the authentication certificate.
    //
    if (request.url.indexOf("/post/", 0) === 0) {
        post.handleRequest(request, response);
        return;
    }

    var handler = router[request.url];

    if (handler === undefined) {
        utils.writeHeadVerboseCORS(response, 404);
        response.end();
        return;
    }

    handler(request, response);
};

var REDIR = "Vai su <a href=\"https://highgarden.polito.it@REQUEST_URL@\">" +
            "https://highgarden.polito.it@REQUEST_URL@</a>";

exports.handleRequestPlain = function (request, response) {

    utils.logRequest(request);

    if (request.url.indexOf("/post/", 0) === 0) {
        post.handleRequest(request, response);
        return;
    }

    response.writeHead(302, {
        'Content-Type': 'text/html',
        'Location': 'https://highgarden.polito.it' + request.url
    });
    response.end(REDIR.replace(/@REQUEST_URL@/g, request.url));
};
