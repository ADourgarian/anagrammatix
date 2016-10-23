var io;
var gameSocket;
var c = require('./Constants');

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    console.log('Connected socket.io client ' + socket.id);

    socket.on('getConstants', function(){
      socket.emit('constants',c);
    });

    socket.on('onStart', function(){
      objects.players.push(objects.newPlayer());
      socket.emit('linkStart',objects);
    });

    socket.on('newPlayer', function(player){
      player.id = objects.players.length;
      console.log('FIRST', player.id);
      objects.players.push(player);
      socket.emit('id', player.id)
    });

    socket.on('move', function(player, newProjectile){
      if (newProjectile != undefined){
        newProjectile = JSON.parse(newProjectile);
        objects.projectileList.projectiles.push(newProjectile);
      }
      player = JSON.parse(player);
      if(objects.players.length > 0 && player.id != undefined){
        var object = objects.players[player.id];
        var xyMaxBarrier = c.dimensions.maxX - object.width;
        var yMaxBarrier = c.dimensions.maxY - object.width;

        objects.players[player.id].id = player.id;

        if (player.Y_Vel != undefined) {
          if (object.Y_pos >= c.dimensions.minY && object.Y_pos <= yMaxBarrier){
            object.Y_pos -= player.Y_Vel * c.speedMultiplier;
          } else if (object.Y_pos < c.dimensions.minY){
            object.Y_pos = c.dimensions.minY;
          } else if (object.Y_pos > yMaxBarrier){
            object.Y_pos = yMaxBarrier;
          }
        }
        if (player.X_Vel != undefined) {
          if (object.X_pos >= c.dimensions.minX && object.X_pos <= xyMaxBarrier){
            object.X_pos -= player.X_Vel * c.speedMultiplier;
          } else if (object.X_pos < c.dimensions.minX){
            object.X_pos = c.dimensions.minX;
          } else if (object.X_pos > xyMaxBarrier){
            object.X_pos = xyMaxBarrier;
          }
        }

        objects.players[player.id] = object;
      }
    })

}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */
