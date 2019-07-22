# Party
A client + server for joining players together into a party so that they can join a game as a group. This software is intended to be forked/copy-pasted and customized for your specific game. It contains an html debug interface demonstrating how to integrate the servce.

### Demo
```js
npm install
npm start
```
Visit http://localhost:1234

### Description
A player may create, join, and leave a party. Players who are in a party may send an invite link to other players. Parties stay synchronized over websockets.

When a party is created it receives a unique id such as `ps1-Hp0jegQbS6goA29P` which can be used to make an invite link. The length may be customized (see parties.js). 

The prefix, in this case `ps1-` is an example of identifying the source of the service in a manner that can be horizontally scaled. One could scale essentially infinitely with urls like `party-service-4.sharkz.io/16/12345` where `party-service-4` is one particular server, and `16` is the 16th party service running on that server, and `12345` is a party.

#### Sent from client
```js
{ action: 'createParty' }
{ action: 'joinParty', partyId }
{ action: 'leaveParty', partyId, memberId }
```

#### Sent from server
When a party is created or joined
```js
{ action: 'identity', partyId, memberId }
{ action: 'party-not-found' } // if server can't find partyId
```
Immediately after the party is joined, the client will also receive messages creating each party member.
```js
{ action: 'create', memberId }
```
and if a party member leaves...
```js
{ action: 'delete', memberId }
```

## Client
The client consists of a debug ui and listeners for the above. It is intended that you use your own ui instead.
```js
// the state your client should track
const state = {
    partyId: null,
    memberId: null,
    isLeader: false,
    members: new Map(),
    log: []
}

// action aka handlers (syncs the state)
onIdentity 
onCreate
onDelete
onPartyNotFound

// requests 
joinParty
createParty
leaveParty
```
This demo will invoke `joinParty` if the url contains a `?party=someid` and has html buttons for `createParty` and `leaveParty`.

## Joining a game
The leader has the ability to join the party into a game together. That's where the party service's job ends, and the gaming begins. The `start` action in index.js is a stub that will return `https://us-west-5.sharkz.io/3` as the server to connect to -- this is a placeholder for contacting a matchmaker and finding a real server.

