var expressAPI = require('express'); // Express API inladen
var httpAPI = require('http'); // HTTP API inladen
var socketioAPI = require('socket.io'); // socket IO API inladen

var app = expressAPI();  // je slaat een nieuwe express app in variable app op
var httpServer = httpAPI.Server(app); // creeer een nieuwe HTTP server voor de express app
var io = socketioAPI(httpServer); // creeer een nieuwe socket IO object voor deze HTTP server

app.use(expressAPI.static('public'));                      // verwijzen waar publieke bestanden staan - zijn voor iedereen toegankelijk

var sockets = [];                                       // hier staat de client informatie in (IP, poort, socket, etc)
var players = [];
var gamedata = [];
var chatMessages = [];

io.on('connection', function (socket) {                 // dat activeert wanneer klant verbonden wordt. io wilt input/output zeggen
    console.log('New connection: ' + socket);           // socket is een browser connectie met de server
    sockets.push(socket);                               // in de array van sockets voegen we de nieuwe socket toe
    socket.on('disconnect', function () {
        console.log('Socket ' + socket + ' disconnected!');                 // klant sluit de browser of gaat naar een andere website
    });
    socket.on('play', function (name) { // een speler duwt op 'PLAY'
        console.log('Player ' + name + ' wants to play!');
        emitToAll('play','Player ' + name + ' wants to play!');
        if (players.length < 2) { // er mogen maximum 2 spelers zijn
            players.push(name); // voeg de speler zijn naam toe aan de lijst van spelers
            for (var i = 0; i < sockets.length; i++) { // stuur naar alle connecties een bericht dat een speler is toegevoegd
                if (players.length == 1) { // speler 1 is net toegevoegd
                    sockets[i].emit('play', {
                        name: name,
                        number: 1,
                        self: sockets[i] == socket
                    });
                } else { // speler 2 is net toegevoegd
                    sockets[i].emit('play', {
                        name: name,
                        number: 2,
                        self: sockets[i] == socket
                    });
                }
            }
        } else {
            console.log('Player ' + name + ' cannot play because there are already 2 players!');
        }
    });
    socket.on('chat', function (chatBericht) {                           // als we van de socket een 'chat' bericht krijgen, dan wordt de onderstaande functie uitgevoerd
        console.log('Chat from socket ' + socket + ': ' + chatBericht);     //in command line verschijn "chat from socket .naam. : .bericht."
        chatMessages.push(chatBericht);                                     // berichten worden opgeslagen in de variable chatMessage, push wilt zeggen zetten
        for (var i = 0; i < sockets.length; i++) {
            sockets[i].emit('chat', chatBericht);                            //een variable eensocket stuurt berichten naar verschillende klanten
        }
    });
    socket.on('gamedata', function (data) {                           // als we van de socket een 'gamedata' bericht krijgen, dan wordt de onderstaande functie uitgevoerd
        console.log('Game data ontvangen van speler ' + data.player.number + ': ' + data.keuze);     // in command line verschijn "chat from socket .naam. : .bericht."
        gamedata[data.player.number - 1] = data.keuze;  // wordt opgeslagen in gamedata -> welke speler keuze heeft gemaakt(schaar, steen,...) en -1 -> omdat array met 0 begint
        var winner = determineWinner(gamedata[0], gamedata[1]);
        chatMessages.push(data);
        emitToAll('gamedata', winner);
        console.log('Winner: ' + (winner ? 'Speler 1' : 'Speler 2'));
    });
});

httpServer.listen(3000, function () {                                             //je kiest de poort 3000
    console.log('listening on *:3000');                                     //in command line verschijn string 'listening on *:3000'
});


function emitToAll(messageType, message) {
    for (var i = 0; i < sockets.length; i++) {
        sockets[i].emit(messageType, message);
    }
}

function determineWinner(choice1, choice2) {
    if (choice1 == choice2) {
        return undefined;                                   //gelijk
    }
    switch (choice1) {
        case 1:
            return choice2 == 3 || choice2 == 4;
        case 2:
            return choice2 == 1 || choice2 == 5;
        case 3:
            return choice2 == 2 || choice2 == 4;
        case 4:
            return choice2 == 2 || choice2 == 5;
        case 5:
            return choice2 == 1 || choice2 == 3;
        default:
        {
            console.log(choice1 + 'is an invalid choice!');
            for (var i = 0; i < sockets.length; i++) {
            sockets[i].emit('gamedata', choice1 + 'is an invalid choice!');}
            chatMessages.push(choice1 + 'is an invalid choice!');
            emitToAll('gamedata', choice1 + 'is an invalid choice!');
            return undefined;

        }
    }
}












