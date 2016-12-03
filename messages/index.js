"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var http = require('http');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

var ageGroups = {
    '18-25': {
        id: 1
    },
    '25-35': {
        id: 2
    },
    '35-50': {
        id: 3
    },
    '50+': {
        id: 4
    }
};

var dates = {
    'Sat 10.12.': {
        date: new Date(2016, 11, 10)
    },
    'Sat 10.12.': {
        date: new Date(2016, 11, 17)
    }
};

bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "Hey <NAME>, ready for a dinner where you'll not only fall in love with food?", ["Yes", "Tell me more"]);
    },
    function (session, results) {
        if (results.response.entity == 'Yes'){
            session.beginDialog('/register');
        } else {
            session.send("TODO");
        }
    }
]);

bot.dialog('/register', [
    function (session, results) {
        session.send("I'm excited to have you on board. But first I need some basic info to set you up with the right people.");
        builder.Prompts.number(session, "Can you give me your ZIP code to locate you?");
    },
    function (session, results) {
        session.userData.zipCode = results.response;
        builder.Prompts.choice(session, "What age group do you belong to?", ageGroups);
    },
    function (session, results) {
        session.userData.ageGroup = ageGroups[results.response.entity].id;
        builder.Prompts.choice(session, "Are you a vegetarian or vegan?", ["No", "vegetarian", "vegan"]);
    },
    function (session, results) {
        session.userData.foodType = results.response.entity;
        builder.Prompts.text(session, "Is there anything else we should know about your food preferences?");
    },
    function (session, results) {
        session.userData.foodPreferences = results.response;
        builder.Prompts.choice(session, "How many could you host, including you?", ["None", "4", "5", "6"]);
    },
    function (session, results, next) {
        if (results.response.entity == '4'){
            session.dialogData.host = 4;
        } else if (results.response.entity == '5'){
            session.dialogData.host = 5;
        } else if (results.response.entity == '6'){
            session.dialogData.host = 6;
        } else {
            session.dialogData.host = 0;
            next();
            return;
        }
        builder.Prompts.text(session, "To what address should people come?");
    },
    function (session, results) {
        builder.Prompts.choice(session, "On what day do you want to participate?", dates);
    },
    function (session, results) {
        session.dialogData.date = ageGroups[results.response.entity].date;
        builder.Prompts.text(session, "Alright. We've almost set you up. To what E-Mail address should we mail the invitation?");
    },
    function (session, results) {
        session.userData.email = results.response;
        postRegistration({
            Firstname: 'Chris',
            Lastname: 'Schneider',
            sex: 'm',
            email: session.userData.email,
            ageGroup: session.userData.ageGroup,
            zip: session.userData.zip,
            host: session.dialogData.host,
            when: session.dialogData.date.getTime(),
            requiredTags: [],
            foodPreferences: session.userData.foodPreferences,
        });
        session.send("Perfect! We'll mail you your invitation on Tuesday, December 6th");
        session.send("Perfect! We'll mail you your invitation on Tuesday, December 13th");
        session.send("…and don't forget to fall in love ;-)");
    },
]);

function postRegistration(obj){
  var request = http.request(post_options, function(response) {
      console.log('Got response', response);
  });
  request.write(JSON.stringify(obj));
  request.end();
}

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

