const express = require('express');
const app = express();
const http = require('http');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const LISTEN_PORT = 8080;
const ABS_STATIC_PATH = __dirname + '/public';

// Routes
app.get('/', function(request, response)
{
    response.sendFile('homeScreen.html', {root:ABS_STATIC_PATH});
});

app.get('/brain', function(request, response)
{
    response.sendFile('brain.html', {root:ABS_STATIC_PATH});
});

app.get('/heart', function(request, response)
{
    response.sendFile('heart.html', {root:ABS_STATIC_PATH});
});

/* Network and Gameplay Description: ----------------------------------------------------------------------------------
 * 
 * 1. Generate scenario button press (both clients have to press to begin a game round)
 *      - Each client emits to server when button has been clicked (ready or not ready)
 *      - Server recieves this information, keeps track of who is ready, and emits it out to all clients
 *      - Clients update their visuals accordingly
 * 2. Scenario round begins
 *      - Server checks every generate scenario button press if both clients are ready
 *      - When both clients are ready, server generates a random scenario and emits it to clients
 *      - Clients update their visuals accordingly to begin a gameround
 *      - Server resets all variables back to false (ready variables and reaction variables)
 *      - Server emits messages for clients to do the same
 *      - Server begins countdown and emits time remaining to the clients every 10 milliseconds
 *      - Clients update their timers accordingly
 * 3. Round gameplay
 *      - Each clients emits to server when a reaction button has been clicked (active or inactive)
 *      - Server recived this information, keeps track of what reaction is active, and emits it out to all clients
 *      - Clients update their visuals accordingly
 * 4. End of game round
 *      - Server emits to clients when timer has ended
 *      - Server checks the active reactions and if no reactions are active, the brain won, otherwise the heart won
 *      - Server emits the winner to the clients
 *      - Clients update their visuals accordingly, announcing the winner
 *      - Clients update their visuals to get ready to start a new game round and wait for scenario button presses
 */

// Functions for network ----------------------------------------------------------------------------------------------

// Generates a random scenario and returns it
var scenarioGenerator = function()
{
    // Generating a random number between 0 and 10
    var randomNumber = Math.floor(Math.random() * 11);

    // Using the random number to pick a random scenario
    switch(randomNumber)
    {
        case 0:
            return "Somebody accidentally tripped you while you were on your way to school";

        case 1:
            return "The bus drove away right as you got to the bus stop";

        case 2:
            return "You lost your headphones at school";

        case 3:
            return "You see someone with the laptop that you really want but can't afford";

        case 4:
            return "You see your crush talking to your best friend";

        case 5:
            return "The coffee shop ran out of coffee right when it was your turn in line";

        case 6:
            return "You got a 90% on your exam";

        case 7:
            return "You found $5 in an old coat pocket";

        case 8:
            return "Your childhood friend did not recognize you as they walked past you";

        case 9:
            return "Somebody took your seat in class";

        case 10:
            return "Your friend got cool new headphones";
    }
}

var checkWinner = function(envy, happy, angry, sad)
{
    if (envy === false && happy === false && angry === false && sad === false)
    {
        return "Brain";
    }
    else
    {
        return "Heart";
    }
}

// Socket.io stuff ----------------------------------------------------------------------------------------------------

// Variables that detect what a new scenario can be generated (when heart and brain are both ready)
var heartReady = false;
var brainReady = false;

// Variable to keep track if a scenario round is currently being played
var scenarioActive = false;

// Timer variable
var timer = 0;

// Variables that keeps track of what reactions are active
var envyActive = false;
var happyActive = false;
var angryActive = false;
var sadActive = false;

io.on('connection', (socket) => 
{

    console.log(socket.id + ' connected');

    socket.on('disconnect', () => 
    {
        console.log(socket.id + 'disconnected');
    });

    // Listening for a heartReady event to send it to all pages 
    socket.on('heartReady', (data) =>
    {
        if (data.ready === true)
        {
            io.sockets.emit('heartReady', {ready:true});

            heartReady = true;

            // Checking if brain user is also ready (if a scenario is not currently active)
            // If they are:
            // - Generate a scenario and emit it to clients
            // - Reset ready variables and emit it to clients
            // - Reset reaction variables and emit it to clients
            // - Set up timer
            // - Check winner at the end of timers and emit it to clients
            if (brainReady === true && scenarioActive === false)
            {
                // Generating scenario
                var scenarioText = scenarioGenerator();

                io.sockets.emit('scenario', {text: scenarioText});

                scenarioActive = true;

                // Resetting ready variables
                heartReady = false;
                brainReady = false;

                io.sockets.emit('heartReady', {ready:false});
                io.sockets.emit('brainReady', {ready:false});

                // Resetting reaction variables
                envyActive = false;
                happyActive = false;
                angryActive = false;
                sadActive = false;

                io.sockets.emit('envy', {active:false});
                io.sockets.emit('happy', {active:false});
                io.sockets.emit('angry', {active:false});
                io.sockets.emit('sad', {active:false});

                // Setting up timer countdown with setInterval()
                timer = 5.00;

                // Decreasing timer by 10 milliseconds every 10 milliseconds and emiting it to clients
                var decreaseTime = setInterval(function() 
                {
                    timer -= 0.01;

                    // Checking that the timer has not hit 0
                    // If it has, clear the timer, emit 0.00 to clients, check for the winner, and emit the winner to clients
                    // If it has not, send the time remaining
                    if (timer <= 0.00)
                    {
                        clearInterval(decreaseTime);

                        io.sockets.emit('timer', {time: '0.00'});

                        var winner = checkWinner(envyActive, happyActive, angryActive, sadActive); 

                        io.sockets.emit('winner', {user: winner});

                        scenarioActive = false;
                    }
                    else
                    {
                        io.sockets.emit('timer', {time: timer.toFixed(2)});
                    }

                }, 10);
            }
        }
        else
        {
            io.sockets.emit('heartReady', {ready:false});

            heartReady = false;
        }
    });

    // Listening for a brainReady event to emit to clients
    socket.on('brainReady', (data) =>
    {
        if (data.ready === true)
        {
            io.sockets.emit('brainReady', {ready:true});

            brainReady = true;

            // Checking if brain user is also ready (if a scenario is not currently active)
            // If they are:
            // - Generate a scenario and emit it to clients
            // - Reset ready variables and emit it to clients
            // - Reset reaction variables and emit it to clients
            // - Set up timer
            // - Check winner at the end of timers and emit it to clients
            if (heartReady === true && scenarioActive === false)
            {
                // Generating scenario
                var scenarioText = scenarioGenerator();

                io.sockets.emit('scenario', {text: scenarioText});

                scenarioActive = true;

                // Resetting ready variables
                heartReady = false;
                brainReady = false;

                io.sockets.emit('heartReady', {ready:false});
                io.sockets.emit('brainReady', {ready:false});

                // Resetting reaction variables
                envyActive = false;
                happyActive = false;
                angryActive = false;
                sadActive = false;

                io.sockets.emit('envy', {active:false});
                io.sockets.emit('happy', {active:false});
                io.sockets.emit('angry', {active:false});
                io.sockets.emit('sad', {active:false});

                // Setting up timer countdown with setInterval()
                timer = 5.00;

                // Decreasing timer by 10 milliseconds every 10 milliseconds and emiting it to clients
                var decreaseTime = setInterval(function() 
                {
                    timer -= 0.01;

                    // Checking that the timer has not hit 0
                    // If it has, clear the timer, emit 0.00 to clients, check for the winner, and emit the winner to clients
                    // If it has not, send the time remaining
                    if (timer <= 0.00)
                    {
                        clearInterval(decreaseTime);

                        io.sockets.emit('timer', {time: '0.00'});

                        var winner = checkWinner(envyActive, happyActive, angryActive, sadActive); 

                        io.sockets.emit('winner', {user: winner});

                        scenarioActive = false;
                    }
                    else
                    {
                        io.sockets.emit('timer', {time: timer.toFixed(2)});
                    }

                }, 10);
            }
        }
        else
        {
            io.sockets.emit('brainReady', {ready:false});

            brainReady = false;
        }
    });

    // Listening for a envy event to record it and emit to clients
    socket.on('envy', (data) =>
    {
        if (data.active === true)
        {
            envyActive = true;

            io.sockets.emit('envy', {active:true});
        }
        else
        {
            envyActive = false;

            io.sockets.emit('envy', {active:false});
        }
    });

    // Listening for a happy event to record it and emit to clients
    socket.on('happy', (data) =>
    {
        if (data.active === true)
        {
            happyActive = true;

            io.sockets.emit('happy', {active:true});
        }
        else
        {
            happyActive = false;

            io.sockets.emit('happy', {active:false});
        }
    });

    // Listening for a angry event to record it and emit to clients
    socket.on('angry', (data) =>
    {
        if (data.active === true)
        {
            angryActive = true;

            io.sockets.emit('angry', {active:true});
        }
        else
        {
            angryActive = false;

            io.sockets.emit('angry', {active:false});
        }
    });

    // Listening for a sad event to record it and emit to clients
    socket.on('sad', (data) =>
    {
        if (data.active === true)
        {
            sadActive = true;

            io.sockets.emit('sad', {active:true});
        }
        else
        {
            sadActive = false;

            io.sockets.emit('sad', {active:false});
        }
    });
});

// --------------------------------------------------------------------------------------------------------------------

server.listen(LISTEN_PORT);
app.use(express.static(ABS_STATIC_PATH));
console.log("Listening on port:" + LISTEN_PORT);