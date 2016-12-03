"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "Hey there, ready for a dinner you'll not only fall in love with food?", ["YES!"]);
    },
    function (session, results) {
        builder.Prompts.number(session, "What is your ZIP code?");
    },
    function (session, results) {
        session.userData.zipCode = results.response;
        builder.Prompts.choice(session, "How many could you host (incl. you)?", ["None", "4", "5", "6"]);
    },
    function (session, results, next) {
        if (results.response.entity == '4'){
            session.userData.numberOfPeoples = 4;
        } else if (results.response.entity == '5'){
            session.userData.numberOfPeoples = 5;
        } else if (results.response.entity == '6'){
            session.userData.numberOfPeoples = 6;
        } else {
            session.userData.numberOfPeoples = 0;
            next();
            return;
        }
        builder.Prompts.text(session, "To what address should people come?");
    },
    function (session, results) {
        builder.Prompts.text(session, "What food preferences do you have?");
    },
    function (session, results) {
        builder.Prompts.choice(session, "On what day do you want to participate?", ["Sat. 10.12.", "Sat. 17.12."]);
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

