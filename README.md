The goal of this project was to create a simple online tic tac toe game. The game has two players and any other user on the website is able to spectate the game. All users can type in the chat to communicate with each other. The first two users to connect are the designated players. 

Front end was done in the React framework of javascript. Due to the low level of this project the front end framework was not very important. I chose React because it could get the job done the same way Vue or Angular would.

For the backend, the backend functions are hosted on AWS Lambda. I used an AWS API Gateway to connect the backend to the frontend via web socket. There was no need for a database as there is no persistent data. Users are only identified by the username they enter when they connect to the game. I figured that because this is just a tic tac toe game, having an actual user registry in a database was unnecessary. The board, turn, and users are all managed via web socket using the Lambda functions. This makes the stack and code very clean and simple. In the case an actual user registry was used in a database, things like user wins could be tracked and displayed. The Lambda code can be found in the Lambda.js file.

The app was deployed via AWS Amplify and can be accessed via the link below:
https://master.d2vjehvn2m3dzb.amplifyapp.com/
