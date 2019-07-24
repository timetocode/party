const { WebSocketServer } = require('@clusterws/cws')
const parties = require('./parties')
const {
	send,
	sendIdentity,
	sendCreateMember,
	sendUpdateMember,
	sendDeleteMember,
	sendStart
} = require('./network')


// removes a player from a party
const removePlayerFromParty = (partyId, memberId) => {
	const { party, newLeader } = parties.leaveParty(partyId, memberId)
	if (party) {
		// remove member from everyone's client
		party.members.forEach(partyMember => {
			sendDeleteMember(player.state.id, partyMember.socket)
		})
		
		if (newLeader) {
			// tell eveyrone who the new leader is
			party.members.forEach(partyMember => {
				sendUpdateMember(partyMember.socket, newLeader.state.id, 'isLeader', true)
			})
		}
	}
}

// creates a party and makes the first member the leader
const createParty = (state) => {
	const { party, member } = parties.createParty(state.socket)
	state.party = party
	state.member = member
	sendIdentity(member.socket, party, member)
	sendCreateMember(member.socket, member)
}

// joins (or reconnects to) an existing party
const joinParty = (state, partyId,  memberId) => {
	const partyInfo = parties.joinParty(state.socket, partyId, memberId)

	if (partyInfo) {
		const { party, member } = partyInfo

		state.party = party
		state.member = member
		sendIdentity(member.socket, party, member)

		// tell all party members about this new member
		party.members.forEach(partyMemberA => {
			sendCreateMember(partyMemberA.socket, member)					
		})

		// tell the new member about all other party members
		party.members.forEach(partyMemberA => {
			if (partyMemberA !== member) {
				sendCreateMember(member.socket, partyMemberA)
			}
		})
	} else {
		// when joining a stale party id
		send(state.socket, { action: 'party-not-found' })
	}
}

// starts the game
const start = (state, onStart) => {
	const party = state.party
	// only leader may start the game
	if (party && party.leader === state.member) {
		const payload = onStart(party)			
		party.members.forEach(partyMember => {
			sendStart(partyMember.socket, payload)
		})
	}
}

// changes one state property of a member, invokes validation
const submitChange = (state, playerProperties, validators, prop, newValue) => {
	const { party, member } = state		
	if (playerProperties.indexOf(prop) !== -1) {
		// prop is allowed
		const value = validators[prop](newValue)
		if (member) {						
			const success = parties.updatePlayer(member.state.id, prop, value)
			if (success && party) {
				// tell everyone the new state
				party.members.forEach(partyMember => {
					sendUpdateMember(partyMember.socket, member.state.id, prop, value)
				})
			}
		}					
	} else {
		console.log('invalid player property submitted', prop)
	}
}

const create = (config) => {
	const {
		SERVICE_ID,
		PARTY_ID_TOKEN_SIZE,
		PLAYER_ID_TOKEN_SIZE,	
		port,
		idleTimeoutMs,
		tickIntervalMs,
		playerProperties,
		validators,
		onStart
	} = config
	
	parties.state.SERVICE_ID = SERVICE_ID || '1-'
	parties.state.PARTY_ID_TOKEN_SIZE = PARTY_ID_TOKEN_SIZE || 4
	parties.state.PLAYER_ID_TOKEN_SIZE = PLAYER_ID_TOKEN_SIZE || 8
	parties.state.idleTimeoutMs = idleTimeoutMs || 10000
	parties.state.tickIntervalMs = tickIntervalMs || 2000

	const server = new WebSocketServer({ port })

	const interval = setInterval(() => {
		while (parties.state.idlePlayers.length > 0) {
			const player = parties.state.idlePlayers.pop()
			removePlayerFromParty(player.party.id, player.state.id)
		}
	}, 2000)


	server.on('connection', (socket, upgReq) => {
		// per connection state
		const state = {
			party: null,
			member: null,
			socket
		}	

		socket.on('message', (jsonObj) => {
			try {
				const message = JSON.parse(jsonObj)
				
				if (message.action === 'createParty') {
					createParty(state)
				}

				if (message.action === 'joinParty') {
					joinParty(state, message.partyId, message.memberId)
				}

				if (message.action === 'leaveParty') {
					removePlayerFromParty(message.partyId, message.memberId)
					socket.close()
				}

				if (message.action === 'start') {
					start(state, onStart)
				}

				if (message.action === 'submitChange') {
					submitChange(state, playerProperties, validators, message.prop, message.value)
				}
			} catch (err) {
				console.log('error responding to client', jsonObj, err)
			}
		})

		socket.on('close', (code, reason) => {
			// closing a connection from the client does nothing
			// only deliberately leaving a party, or going idle will remove a player
		})

		socket.on('error', (err) => {
			console.log('error', err)
		})

		socket.on('pong', (a) => {
			if (state.member) {
				parties.refreshPlayer(state.member.state.id)
			}
		})

		//socket.on('ping', (a) => { })
	})
}

module.exports = create
