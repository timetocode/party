const { WebSocketServer } = require('@clusterws/cws')
const parties = require('./parties')

const send = (socket, obj) => {
	socket.send(JSON.stringify(obj))
}

const sendIdentity = (socket, party, member) => {
	const payload = {
		action: 'identity',
		partyId: party.id,
		memberId: member.state.id,
		isLeader: party.leader === member
	}
	send(socket, payload)
}

const sendUpdateMember = (socket, memberId, prop, value) => {
	send(socket, { action: 'update', memberId, prop, value })
}

const sendCreateMember = (socket, member) => {
	const payload = { action: 'create' }
	Object.assign(payload, member.state)
	send(socket, payload)
}

const sendDeleteMember = (socket, memberId) => {
	const payload = { action: 'delete', memberId }
	send(socket, payload)
}

const sendStart = (socket, url) => {
	const payload = { action: 'start', url }
	send(socket, payload)
}

const removePlayerFromParty = (partyId, memberId) => {
	const { party, newLeader } = parties.leaveParty(partyId, memberId)
	if (party) {
		party.members.forEach(partyMember => {
			sendDeleteMember(player.state.id, partyMember.socket)
		})
		
		if (newLeader) {
			party.members.forEach(partyMember => {
				sendUpdateMember(partyMember.socket, newLeader.state.id, 'isLeader', true)
			})
		}
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
		verbose,
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
		// per connection state, other than the socket object
		const state = {
			party: null,
			member: null
		}	

		socket.on('message', (jsonObj) => {
			try {
				const message = JSON.parse(jsonObj)

				if (message.action === 'createParty') {
					const { party, member } = parties.createParty(socket)
					if (verbose) {
						console.log(`created party ${party.id} and member ${member.state.id}`)
					}

					state.party = party
					state.member = member
					sendIdentity(member.socket, party, member)
					sendCreateMember(member.socket, member)
				}

				if (message.action === 'joinParty') {
					const partyInfo = parties.joinParty(socket, message.partyId, message.memberId)

					if (partyInfo) {
						const { party, member } = partyInfo
						if (verbose) {
							console.log(`join party ${party.id} and member ${member.state.id}`)
						}
						state.party = party
						state.member = member
						sendIdentity(member.socket, party, member)

						party.members.forEach(partyMemberA => {
							sendCreateMember(partyMemberA.socket, member)					
						})
						party.members.forEach(partyMemberA => {
							if (partyMemberA !== member) {
								sendCreateMember(member.socket, partyMemberA)
							}
						})
					} else {
						send(socket, { action: 'party-not-found' })
					}

				}

				if (message.action === 'leaveParty') {
					removePlayerFromParty(message.partyId, message.memberId)
					socket.close()
				}

				if (message.action === 'start') {
					const party = state.party
					if (party && party.leader === state.member) {
						const payload = onStart(party)			
						party.members.forEach(partyMember => {
							sendStart(partyMember.socket, payload)
						})
					}
				}

				if (message.action === 'submitChange') {
					const { party, member } = state		
					const prop = message.prop
					if (playerProperties.indexOf(prop) !== -1) {
						// prop is allowed
						const value = validators[prop](message.value)
						if (member) {						
							const success = parties.updatePlayer(member.state.id, prop, value)
							if (success && party) {
								party.members.forEach(partyMember => {
									sendUpdateMember(partyMember.socket, member.state.id, prop, value)
								})
							}
						}					
					} else {
						console.log('invalid player property submitted', prop)
					}
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
