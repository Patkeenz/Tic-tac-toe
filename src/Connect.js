import React, {useState, useCallback, useRef, useEffect} from 'react';
import { Button } from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Paper from '@material-ui/core/Paper';
import './Connect.css';

const URL = 'wss://dw2b1rbcfa.execute-api.us-east-1.amazonaws.com/production';

const Connect = () => {
    const socket = useRef(); //socket for the user to connect to
    const [connected, setConnected] = useState(false); //useState for verifying whether user is connected or not
    const [members, setMembers] = useState([]); //useState for setting the list of members in the game
    const [chatRows, setChatRows] = useState([]); //useState for updating the messages displayed in chat

    const turn = {turn: 'Player One (X)'};
    const [cells, setCells] = useState(Array(9).fill('')); //useState for managing the content of the nine cells of the table used for the <td> elements
    const [winner, setWinner] = useState(null); //useState to identify the 'winner' 
    const name = useRef(); //name of the user in the socket

    window.onunload = () =>{//disconnect the user if they close their window
      onDisconnect(); 
    }

    const onSocketOpen = useCallback(() => {//once the socket is opened, set the name of the current user in the socket
        setConnected(true);
        var x = name.current;
        socket.current?.send(JSON.stringify({action: 'setName', name: x}));
    }, []);

    const onSocketClose = useCallback(() => {//if the socket is closing, reset variables
        setMembers([]);
        setConnected(false);
        setChatRows([]);
        turn.turn = 'Player One (X)';
        setCells(Array(9).fill(''));
        setWinner(null);
    }, []);

    const onSocketMessage = useCallback((dataStr) => {//processes the different types of messages from the socket
        const data = JSON.parse(dataStr);
        if(data.members){//if the message contains members, update the members and the first two players on the page
            setMembers(data.members);
            if(data.members.length===1){
                document.getElementById('playerone').innerHTML = "Player one: " + data.members[0];
                document.getElementById('playertwo').innerHTML = 'Waiting for another player to join..';
            }
            if(data.members.length>=2){
                document.getElementById('playerone').innerHTML = "Player one: " + data.members[0];
                document.getElementById('playertwo').innerHTML = "Player two: " + data.members[1];
            }
        }
        else if(data.message){//if the message contains a message, update the chat with the message
            setChatRows(oldArray => [...oldArray, <span><b>{data.message}</b></span>])
        }
        else if(data.systemMessage){//if the message contains a system message, update the chat with the system message
            setChatRows(oldArray => [...oldArray, <span><i>{data.systemMessage}</i></span>])         
        }
        else if(data.board){//if the message contains board, update the board 
            setCells(data.board);
        }
        else if(data.turn){//if the message contains turn, update the turn 
          if(data.turn==='X'){
            turn.turn = 'Player One (X)';
            document.getElementById('turn').innerHTML = "Turn: " + turn.turn;
          }
          else{
            turn.turn = 'Player Two (O)';
            document.getElementById('turn').innerHTML = "Turn: " + turn.turn;
          }
        }
        else if(data.win){//if the message contains win (will be sent on every boardClick action), see if the win is valid or not
          if(data.win !== "No Winner"){
            setWinner(data.win);
          }
        }
        else if(data.reset){//if the message contains reset, reset the board 
          setWinner(null);
        }
    }, []);

    const onConnect = useCallback(()=>{//verifies the user has entered a username before connecting the user to the socket
      console.log("name");
        name.current = document.getElementById("name").value;
        if(name.current===''){
            alert("Please enter a username before connecting");
            return;
        }
        if(socket.current?.readyState !== WebSocket.OPEN){
            socket.current = new WebSocket(URL);
            socket.current.addEventListener('open', onSocketOpen)
            socket.current.addEventListener('close', onSocketClose)
            socket.current.addEventListener('message', (event) =>{
                onSocketMessage(event.data);
            });
        }
    }, []);

    useEffect(() => {
        return () => {
          socket.current?.close();
        };
    }, []);

    const onSendMessage = useCallback(() => {//sends an action of type message to the socket with the user's input as the message value
        const message = document.getElementById("message").value;
        socket.current?.send(JSON.stringify({
          action: 'sendMessage',
          message,
        }));
        document.getElementById("message").value = '';
    }, []);

    const onDisconnect = useCallback(() => {//disconnects user from the socket
        if (connected) {
          socket.current?.close();
        }
    }, [connected]);

    const handleClick = useCallback((num) => { //handles user clicks on the tic tac toe board
        if(turn.turn === 'Player One (X)' && name.current!==document.getElementById('playerone').innerHTML.substring(12)){//check if it is player one's turn and the user is player one
          return;
        }
        else if(turn.turn === 'Player Two (O)' && name.current!==document.getElementById('playertwo').innerHTML.substring(12)){//check if it is player two's turn and the user is player two
          return;
        }
        else if(winner!==null){ //check if user is clicking a cell that has already been clicked or their is a winner
          return;
        }
  
        socket.current?.send(JSON.stringify({
          action: 'boardClick',
          gridNum: num,
        }));
    }, []);
  
    const handleRestart = useCallback(() =>{//handles the restart of the tic tac toe game
        socket.current?.send(JSON.stringify({
        action: 'boardReset'
        }));
    }, []);
  
    const Cell = ({num}) => {//generates cell html
        return <td onClick = {() => handleClick(num)}>{cells[num]}</td>
    };

      return (
          <div>
            {!connected && (
                <>
                <div className = "container1">
                    <h1 className="intro-header">Tic Tac Toe </h1>
                    <h1 className="enter-header">Enter Your Username!</h1>
                    <div>
                    <input id="name"></input>
                    </div>
                    <div className="button4-div">
                    <button className = "button-4" onClick ={onConnect}>Connect</button>
                    </div>
                </div>
                </>
            )}

            {connected &&(
                <>
              <div className = "main-div">
                <div className = 'container'>
                    <p class= 'winnertext' id="turn"></p>
                    <table>
                    <tbody>
                      <tr>
                        <Cell num = {0}/>
                        <Cell num = {1}/>
                        <Cell num = {2}/>
                      </tr>
                      <tr>
                        <Cell num = {3}/>
                        <Cell num = {4}/>
                        <Cell num = {5}/>
                      </tr>
                      <tr>
                        <Cell num = {6}/>
                        <Cell num = {7}/>
                        <Cell num = {8}/>
                      </tr>
                  </tbody>
                  </table>
                  {winner && (
                    <>
                    <p class = 'winnertext'> {winner} is the winner!</p>   
                    <button class='button-3' onClick ={() => handleRestart()}>Restart Game</button>
                    </>
                  )}
                </div>
                <div>
                  <h1 id="playerone"></h1>
                  <h1 id="playertwo"></h1>
                </div>
                <CssBaseline />
                <Container maxWidth="md" className="chat-container">
                  <Grid container className="chat-grid">
                    <Grid item xs={2} className = "grid-item">
                      <List component="nav">
                        {members.map(item =>
                        <ListItem key={item} button>
                        <ListItemText className='list-item-text' primary={item} />
                        </ListItem>
                        )}
                      </List>
                    </Grid>
                  <Grid className="grid-style" item container direction="column" xs={10} >
                    <Paper className="paper-style">
                      <Grid item container className="chat-grid" direction="column">
                        <Grid item className="paper-style">
                          <ul className="ul">
                            {chatRows.map((item, i) =>
                            <li key={i} className="li">{item}</li>
                            )}
                          </ul>
                        </Grid>
                        <Grid item style={{ margin: 10 }}>
                        <input id="message" className="input-chat"></input>
                        <Button style={{ marginRight: 298}} variant="outlined" size="small" disableElevation onClick={onSendMessage}>Send Message</Button>
                        <Button variant="outlined" size="small" disableElevation onClick={onDisconnect}>Disconnect</Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  </Grid>
                </Container>
            </div>
                </>
            )}
          </div>
      )
}

export default Connect;