# Party
A client + server for joining players together into a party so that they can join a game as a group.

### Demo
```js
npm install
npm start
```
Visit http://localhost:1234 for a crude demo. Making the real ui is left to the game developer. Use multiple browsers to connect multiple users (the demo uses localStorage in a manner that opening multiple tabs will simply be treated as one player).


There is also a prettier demo in Vuex+VueJS at [https://github.com/timetocode/vuex-party-example]

### Description
A player may create, join, and leave a party. Players who are in a party may send an invite link to other players.

### Party links and scaling
When a party is created it receives a unique id such as `1-Hp0` which becomes an invite link. Party links can be prefixed for for scaling (or use a subdomain).

### Pseudo persistence

Closing the browser does not remove a player from a party. This is by design, so that the party may leave the webpage housing the websocket connection to go play a game, and then return to that url and still be in a party together. The `idleTimeoutMs` specifies exactly how long they may be gone before the party disappears.

After the timeout has elapsed, players will need to reform a party.


### Service / server api
```js
const createPartyService = require('../server/createPartyService')

createPartyService({
	SERVICE_ID: '1-',
	PARTY_ID_TOKEN_SIZE: 4,
	PLAYER_ID_TOKEN_SIZE: 8,
	port: 8888,
	idleTimeoutMs: 1000 * 60 * 60,
	tickIntervalMs: 2000,
	playerProperties: ['name', 'foo', 'bar'],
	validators: {
		name(value) {
			// do some actual validation here...
			console.log('name validator')
			return value
		},
		foo(value) {
			return value
		},
		bar(value) {
			return value
		},
	},
	onStart: (party) => {
		console.log('party is ready to play!')
		console.log(party)
		// this is where we pick a server, instead
		// of sending this hardcoded example
		return {
			url: `https://us-west-5.sharkz.io/3`
		}
	}
})
```

`SERVICE_ID` is the prefix to the party id strings

`PARTY_ID_TOKEN_SIZE` is the length of the party id strings

`PLAYER_ID_TOKEN_SIZE` is the length of the player id strings

`port` which port the service listens on

`idleTimeoutMs` how long a player can be disconnected from the party service before being removed from the party

`tickIntervalMs` the tickrate of the party service, affects how frequently the serverside checks if players are idle, and also the ping/pong frequency

`playerProperties` an array of properties that are allowed to exist on party members

`validators` validation functions to invoke when one of the player properties is modified by a client -- use this to sanitize/clean up user input

`onStart` a function to invoke when the party leader chooses to start the game. This is where we can select a server for the party to join and return it to the party.

## Client api
Note: The example folder contains a demo of a working client.

### Client Actions
The client has 5 actions relating to creating/joining/leaving parties, modifying their user data, and starting the game.

```js 
socket = createParty()
```
^creates a new party and joins it

```js 
socket = joinParty(partyId, /*memberId*/)
```
^joins an existing party, `memberId` is optional (will receive a new `memberId` if none provided)

Both `createParty` and `joinParty` will prompt the server to send the client data about the party and all of its members.

```js 
leaveParty(socket)
```
 ^leaves a party, will close socket



```js 
submitChange(socket, 'name', 'alex')
```
^will change this party member's `name` to `alex` (or any prop to any value -- see the server side api for specifying and validating these)

```js
start(socket)
```
^will tell the party server that you wish to start the game, only the leader may do this


### Client Events
These are events the client can receive after connecting, and are used to keep the client in sync.

```js 
partyEvents.on('identity', identity => {
    // { partyId, memberId, isLeader}
})
```
^this client's party, memberId, and leader status

```js 
partyEvents.on('create', member => {
    // { id, isLeader, customProps }
})
```
^a new party member

```js 
partyEvents.on('update', (id, prop, value) => {
    // id, prop value
})
```
^a changed property of an existing party member

```js 
partyEvents.on('delete',id  => {
    // id
})
```
^a party member left

```js 
partyEvents.on('disconnect', () => { })
```
^we lost connection

```js 
partyEvents.on('party-not-found', () => { })
```
^we tried to join a party that did not exist

```js 
partyEvents.on('start', (payload) => { })
```
^the leader started the game! see the server side `onStart` to customize the payload
