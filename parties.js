const token = require('./tokenGenerator')

const SERVICE_ID = 'ps1' /* can be an argument, if scaling horizontally */
const PARTY_ID_TOKEN_SIZE = 16
const PLAYER_ID_TOKEN_SIZE = 16

const state = {
	parties: new Map()
}

// creates a party and its leader
const createParty = (socket) => {
	const party = {
		id: token.generate(PARTY_ID_TOKEN_SIZE, SERVICE_ID),
		members: new Map(),
		leader: null
	}

	state.parties.set(party.id, party)

	const member = createMember(socket)
	party.members.set(member.state.id, member)
	party.leader = member

	return {
		party,
		member
	}
}

// creates a single member
const createMember = (socket) => {
	return {
		state: {
			id: token.generate(PLAYER_ID_TOKEN_SIZE),
			isReady: false
		},
		socket
	}
}

// creates a new member and joins it to a party
const joinParty = (socket, partyId) => {
	const party = state.parties.get(partyId)
	if (!party) {
		return null
	}
	const member = createMember(socket)
	party.members.set(member.state.id, member)

	return {
		party,
		member
	}
}

// leaves a party
const leaveParty = (partyId, memberId) => {
	const party = state.parties.get(partyId)
	if (!party) {
		return false
	}

	party.members.delete(memberId)

	if (party.members.size < 1) {
		state.parties.delete(partyId)
	}
	return party
}

module.exports = {
	createParty,
	joinParty,
	leaveParty
}