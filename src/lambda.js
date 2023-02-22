const AWS = require('aws-sdk');

const ENDPOINT =  'dw2b1rbcfa.execute-api.us-east-1.amazonaws.com/production/'
const client = new AWS.ApiGatewayManagementApi({endpoint: ENDPOINT});
const names = {};
const grid = ['','','','','','','','',''];
const turn = {"turn":"X"}

const sendToOne = async(id,body) =>{//sends json body to a single recipient
    try{
        await client.postToConnection({
            'ConnectionId': id,
            'Data': Buffer.from(JSON.stringify(body)),
        }).promise();
    }
    catch (err) {
        console.log(err);
    }
};

const sendToAll = async(ids, body) => {//uses sendToOne function on all users connected to socket
    const all = ids.map(i => sendToOne(i,body));
    return Promise.all(all);
};

const checkWin = () =>{ //check if a user has won
          let combinations = {
              across: [[0,1,2],[3,4,5],[6,7,8],],
              down: [[0,3,6],[1,4,7],[2,5,8],],
              diagonal: [[0,4,8],[2,4,6],]
          };
            
          var winner = false;
          for(let combination in combinations){ //for each direction
              combinations[combination].forEach((direction) =>{ // for each direction array check if all 3 are the same and not null
                  if(grid[direction[0]] === '' || grid[direction[1]] === '' || grid[direction[2]] === ''){
                      //do nothing
                  }
                  else if(grid[direction[0]] === grid[direction[1]] && grid[direction[1]] === grid[direction[2]]){
                      if(grid[direction[0]] === ''){
                          //do nothing
                      }
                      else{
                          winner = true;
                      }
                  }
              });
          }
  
          if(winner){
              if(turn.turn ==='X'){
                  return Object.values(names)[1];
              }
              else{
                  return Object.values(names)[0];
              }
          }
          var full = 0;
          for (var i = 0; i < grid.length; i++) {//check if all squares are full
              if(grid[i]!==''){
                  full++;
                  if(full===9){
                      return 'Nobody';
                  }
              }
        }
         return 'No Winner';
};

exports.handler = async(event) => {
    // TODO implement
    if (event.requestContext){
        const connectionId = event.requestContext.connectionId;
        const routeKey = event.requestContext.routeKey;
        let body = {};
        try{
            if (event.body){
                body = JSON.parse(event.body);
            }
        }
        catch(err){
            
        }
        
        switch(routeKey){
            case '$connect':
                break;
            case '$disconnect': //disconnect the user, message the other users that they have left the chat, if they are a player call 'boardReset'
                await sendToAll(Object.keys(names), {systemMessage: `${names[connectionId]} has left the chat`});
                var player= false;
                if(names[connectionId] === Object.values(names)[0] || names[connectionId] === Object.values(names)[1]){
                    player = true;
                }
                delete names[connectionId];
                await sendToAll(Object.keys(names), {members: Object.values(names)});
                if(!player){
                    break;
                }
            case 'boardReset': //reset the board and turn and let users know the board was reset
                for(let i=0; i<9; i++){
                    grid[i] = '';
                }
                turn.turn = "X";
                await sendToAll(Object.keys(names), {board: Object.values(grid)});
                await sendToAll(Object.keys(names), {turn: turn.turn});
                await sendToAll(Object.keys(names), {reset: 'reset'});
                break;
            case '$default':
                break;
            case 'setName'://set the name of the user connecting to the socket, let other users know they have joined and update them with the current board
                names[connectionId] = body.name;
                await sendToOne(connectionId, {board: Object.values(grid)});
                await sendToOne(connectionId, {turn: turn.turn});
                await sendToAll(Object.keys(names), {members: Object.values(names)});
                await sendToAll(Object.keys(names), {systemMessage: `${names[connectionId]} has joined the chat`});
                break;
            case 'sendMessage'://sends a message to other connected users
                await sendToAll(Object.keys(names), {message: `${names[connectionId]}: ${body.message}`});
                break;
            case 'boardClick'://updates the board when a player clicks the board
                if(grid[body.gridNum]!=='' || (turn.turn =="X" && names[connectionId] !== Object.values(names)[0]) || (turn.turn =="O" && names[connectionId] !== Object.values(names)[1])){
                    break;
                }
                grid[body.gridNum]= turn.turn;
                if(turn.turn =="X"){
                    turn.turn = "O";
                }
                else{
                    turn.turn = "X";
                }
                await sendToAll(Object.keys(names), {board: Object.values(grid)});
                await sendToAll(Object.keys(names), {turn: turn.turn});
                await sendToAll(Object.keys(names), {win: checkWin()});
                break;
        }
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello From Lambda!'),
    };
    return response;
};