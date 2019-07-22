const { WebSocketServer } = require('@clusterws/cws')
const parties = require('./parties')

const port = 8888
const VERBOSE = true
const server = new WebSocketServer({ port })

const send = (socket, obj) => {
	socket.send(JSON.stringify(obj))
}

const sendIdentity = (party, member, socket) => {
	const payload = {
		type: 'identity',
		partyId: party.id,
		memberId: member.state.id,
		isLeader: party.leader === member
	}

	send(socket, payload)
}

// TODO for custom data added to members
const updateMember = (member, prop, value) => {
	// TODO validate props! __proto__ etc would be dangerous
	state.member.state[prop] = value
	const payload = {
		type: 'update',
		memberId: member.state.id,
		prop,
		value
	}

	send(member.socket, payload)
}

const sendCreateMember = (member, socket) => {
	const payload = { type: 'create' }
	Object.assign(payload, member.state)
	send(socket, payload)
}

const sendDeleteMember = (memberId, socket) => {
	console.log('delete!', memberId)
	const payload = { type: 'delete', memberId }
	send(socket, payload)
}

server.on('connection', (socket, upgReq) => {
	const state = {
		party: null,
		member: null
	}

	socket.on('message', (jsonObj) => {
		try {
			const message = JSON.parse(jsonObj)

			if (message.action === 'createParty') {
				const { party, member } = parties.createParty(socket)
				if (VERBOSE) {
					console.log(`created party ${party.id} and member ${member.state.id}`)
				}

				state.party = party
				state.member = member
				sendIdentity(party, member, member.socket)
				sendCreateMember(member, member.socket)
			}
			if (message.action === 'joinParty') {
				const partyInfo = parties.joinParty(socket, message.partyId)

				if (partyInfo) {
					const { party, member } = partyInfo
					if (VERBOSE) {
						console.log(`join party ${party.id} and member ${member.state.id}`)
					}
					state.party = party
					state.member = member
					sendIdentity(party, member, member.socket)
					party.members.forEach(partyMemberA => {					
						sendCreateMember(member, partyMemberA.socket)
						sendCreateMember(partyMemberA, member.socket)						
					})
				} else {
					send(socket, { type: 'party-not-found' })
				}

			}
			if (message.action === 'leaveParty') {
				const party = parties.leaveParty(message.partyId, message.memberId)
				if (!party) {
					console.log('failed to leave a party...')
				} else {
					party.members.forEach(partyMember => {
						sendDeleteMember(message.memberId, partyMember.socket)
					})
				}

				socket.close()
			}
		} catch (err) {
			console.log('error responding to client', jsonObj, err)
		}
	})

	socket.on('close', (code, reason) => {
		if (state.party && state.member) {

			const party = parties.leaveParty(state.party.id, state.member.state.id)
			if (VERBOSE) {
				console.log(`leaving party ${party.id} and member ${state.member.state.id}`)
			}
			if (party) {
				party.members.forEach(partyMember => {
					sendDeleteMember(state.member.state.id, partyMember.socket)
				})
			}
		} else {

			if (VERBOSE) {
				console.log('closed a connect from someone without a member or party')
			}
		}
	})

	socket.on('error', (err) => {
		console.log('error', err)
	})

	socket.on('pong', () => { })
	socket.on('ping', () => { })
})