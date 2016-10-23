;
jQuery(function($){
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
          // io is a global defined by /socket.io/socket.io.js
          var socket = IO.socket;
          var C = {};
          var log = 1;
          var frameObject = {};
          var playerFrame = {};
          var start = 0;
          var coordinates = {
            x: 0,
            y: 0
          };
          var fireRate = 5;
          var fireNumber = 0;
          var removeNumber = 0;
          var objectsServer = {};
          objectsServer.players = [];
          objectsServer.projectiles = [];
          var objectsClient = {};
          objectsClient.players = [];
          objectsClient.projectiles = [];
          var logger = 0;


          socket.emit('getConstants');
          socket.on('constants',function(constants){
            C = constants;
            console.log(C);
            start = 1;
            //Create the renderer
            var renderer = PIXI.autoDetectRenderer(256, 256);
            renderer = PIXI.autoDetectRenderer(
              C.width, C.height,
              {antialias: false, transparent: false, resolution: 1}
            );

            PIXI.loader
                .add("../images/gridTile.png")
                .load(setup);

            function setup() {
              console.log(C.width,C.height);
              //Create the `cat` sprite from the texture
              var tile = new PIXI.TilingSprite(
                PIXI.loader.resources["../images/gridTile.png"].texture,
                C.dimensions.maxX - C.dimensions.minX,
                C.dimensions.maxY - C.dimensions.minY + 25
              );

              //Add the cat to the stage
              stage.addChild(tile);

              //Render the stage
              renderer.render(stage);
            }

            //Add the canvas to the HTML document
            document.body.appendChild(renderer.view);

            //Create a container object called the `stage`
            var stage = new PIXI.Container();

            //Tell the `renderer` to `render` the `stage`
            renderer.render(stage);

          })

          socket.on('linkStart', function(obj){
            console.log(obj);
            //objectsServer.players = obj.players;
            playerFrame.id = obj.players.length -1;


          });

          document.onkeydown = function(event) {
            if (!event)
              event = window.event;
            var code = event.keyCode;
            if (event.charCode && code == 0)
              code = event.charCode;
            switch(code) {
              case 65: // left
                playerFrame.X_Vel = 1;
                break;
              case 87: //up
                playerFrame.Y_Vel = 1;
                break;
              case 68: //right
                playerFrame.X_Vel = -1;
                break;
              case 83: //down
                playerFrame.Y_Vel = -1;
                break;
            }
            event.preventDefault();
          };

          document.onkeyup = function(event) {
            if (!event) {
              event = window.event;
            }
            var code = event.keyCode;
            if (event.charCode && code == 0)
              code = event.charCode;
            switch(code) {
              case 65: // left
                playerFrame.X_Vel = 0;
                break;
              case 87: //up
                playerFrame.Y_Vel = 0;
                break;
              case 68: //right
                playerFrame.X_Vel = 0;
                break;
              case 83: //down
                playerFrame.Y_Vel = 0;
                break;
            }
          };

          (function() {

            document.onmousemove = handleMouseMove;
            function handleMouseMove(event) {
              var dot, eventDoc, doc, body, pageX, pageY;

              event = event || window.event; // IE-ism

              // If pageX/Y aren't available and clientX/Y are,
              // calculate pageX/Y - logic taken from jQuery.
              // (This is to support old IE)
              if (event.pageX == null && event.clientX != null) {
                eventDoc = (event.target && event.target.ownerDocument) || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;

                event.pageX = event.clientX +
                  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                  (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY +
                  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                  (doc && doc.clientTop  || body && body.clientTop  || 0 );
              }

              // Use event.pageX / event.pageY here
              coordinates.x = event.pageX;
              coordinates.y = event.pageY;

            }
          })();

          socket.on('frame', function (pack) {
            frameObject = JSON.parse(pack);
          });

          // send move every 20 ms
          var move = setInterval(function(){
            if (game.input.activePointer.isDown && fireNumber > fireRate) {
              fireNumber = 0;
              if (game.input.mousePointer.x){
                coordinates.x = game.input.mousePointer.x;
              }
              if (game.input.mousePointer.y) {
                coordinates.y = game.input.mousePointer.y;
              }
              var newProjectile = objectsLibrary.newProjectile(objectsServer.players[playerFrame.id], coordinates);
              socket.emit('move', JSON.stringify(playerFrame), JSON.stringify(newProjectile));

            } else {
              // next move for player
              socket.emit('move', JSON.stringify(playerFrame));
            }
          }, 20);

          // Update Game Object Positions/info
          socket.on('frame', function (frameObject) {
            frameObject = JSON.parse(frameObject);
            if (start == 1){
              updateGame();
            }
            if (logger> 600){
              logger = 0;
              log = 1;
            } else {
              log = 0;
              logger++
            }
          });

          function updateGame(){
            fireNumber++;
            // update players
            for (var i in frameObject.players) {
              if (!objectsClient.players[i]) {
                objectsServer.players[i] = frameObject.players[i];
                var player = game.add.sprite(frameObject.players[i].X_pos, frameObject.players[i].Y_pos, 'red_circle_medium');
                objectsClient.players.push(player);
                console.log("client players",objectsClient.players);
              } else {
                if (log === 1){
                  console.log("server players",objectsServer.players);
                }
                objectsServer.players[playerFrame.id] = frameObject.players[playerFrame.id];
                objectsClient.players[i].x = frameObject.players[i].X_pos;
                objectsClient.players[i].y = frameObject.players[i].Y_pos;
              }
            }
            //update projectiles
            removeNumber += frameObject.projectileList.removeNumber;
            if (removeNumber > 0){
              for (var i = 0; i<removeNumber; i++) {
                var x = objectsClient.projectiles.shift();
                x.destroy();
                objectsServer.projectiles.splice(0,1);
                removeNumber -= 1;
              }
            }

            for (var i = 0; i < frameObject.projectileList.projectiles.length; i++) {
              if (frameObject.projectileList.projectiles.length - objectsServer.projectiles.length > 0) {
                objectsServer.projectiles.push(frameObject.projectileList.projectiles[i]);
                var projectile = game.add.sprite(frameObject.projectileList.projectiles[i].X_pos, frameObject.projectileList.projectiles[i].Y_pos, 'red_circle_small');
                objectsClient.projectiles.push(projectile);
              } else {
                objectsClient.projectiles[i].x = frameObject.projectileList.projectiles[i].X_pos;
                objectsClient.projectiles[i].y = frameObject.projectileList.projectiles[i].Y_pos;
              }
            }
          }

          var objectsLibrary = {
            getRandomInt : function (min, max) {
              return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            newPlayer : function () {
              var object = {};
              object.width = C.startingWidth;
              object.X_pos = this.getRandomInt(C.dimensions.minX, C.dimensions.maxX);
              object.Y_pos = this.getRandomInt(C.dimensions.minY, C.dimensions.maxY) - object.width;
              object.X_Vel = 0;
              object.Y_Vel = 0;
              return object;
            },
            newProjectile : function (player, coordinates) {
              var projectile = {};
              projectile.coordinates = {};

              projectile.shooter = playerFrame.id;
              projectile.width = C.projectileWidth;
              projectile.X_origin = player.X_pos + (player.width / 2);
              projectile.Y_origin = player.Y_pos + (player.width / 2);
              projectile.X_pos = player.X_pos + (player.width / 2);
              projectile.Y_pos = player.Y_pos + (player.width / 2);
              projectile.coordinates.x = coordinates.x;
              projectile.coordinates.y = coordinates.y;
              projectile.alive = true;

              return projectile;
            }
          };

        },
    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            // App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            // App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            // App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom === 2) {
                    // console.log('Room is full. Almost ready!');

                    // Let the server know that two players are present.
                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');
                socket.emit('onStart');
                // Display the Join Game HTML on the player's screen.
                //App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            // onPlayerStartClick: function() {
            //     // console.log('Player clicked "Start"');
            //
            //     // collect data to send to the server
            //     var data = {
            //         gameId : +($('#inputGameId').val()),
            //         playerName : $('#inputPlayerName').val() || 'anon'
            //     };
            //
            //     // Send the gameId and playerName to the server
            //     IO.socket.emit('playerJoinGame', data);
            //
            //     // Set the appropriate properties for the current player.
            //     App.myRole = 'Player';
            //     App.Player.myName = data.playerName;
            // },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            // onPlayerRestart : function() {
            //     var data = {
            //         gameId : App.gameId,
            //         playerName : App.Player.myName
            //     }
            //     IO.socket.emit('playerRestart',data);
            //     App.currentRound = 0;
            //     $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            // },
        }

    };

    IO.init();
    //App.init();

}($));
