const token = require('./tokenGenerator')

const state = {
	SERVICE_ID: null,
	PARTY_ID_TOKEN_SIZE: null,
	PLAYER_ID_TOKEN_SIZE: null,	
	tickIntervalMs: null,
	idleTimeoutMs: null,
	parties: new Map(),
	players: new Map(),
	idlePlayers: []
}

/**
 * Creates a new party, one member, and makes that member the leader
 * @param {*} socket socket of the leader
 */
const createParty = (socket) => {
	const party = {
		id: token.generate(state.PARTY_ID_TOKEN_SIZE, state.SERVICE_ID),
		members: new Map(),
		leader: null,
		lastActive: Date.now()
	}

	state.parties.set(party.id, party)

	const member = createPlayer(socket, party)	
	member.state.isLeader = true
	party.members.set(member.state.id, member)
	state.players.set(member.state.id, member)
	party.leader = member

	return {
		party,
		member
	}
}

/**
 * Creates a member
 * @param {*} socket socket of the member
 * @param {*} existingId (optional) will use memberId, or generate a new one
 */
const createPlayer = (socket, party, existingId) => {
	return {
		/* networked variables */
		state: {
			id: existingId || token.generate(state.PLAYER_ID_TOKEN_SIZE),
			name: 'anon',
			isReady: false,
			isLeader: false,
		},
		party,
		socket,
		lastActive: Date.now()
	}
}

/**
 * Creates a member and joins it to a party. If memberId is 
 * used, will connect a new socket to an existing member
 * @param {*} socket socket of the member
 * @param {*} partyId party to join
 * @param {*} memberId (optional) will use memberId, or generate a new one
 */
const joinParty = (socket, partyId, memberId) => {
	const party = state.parties.get(partyId)
	if (!party) {
		return null
	}

	let member = null
	if (memberId && state.players.has(memberId)) {
		// already exists *rejoin*		
		member = state.players.get(memberId)
		member.socket.close()
		member.socket = socket // using a new connection
	} else {
		// did not exist, *join*
		member = createPlayer(socket, party)
		party.members.set(member.state.id, member)
		state.players.set(member.state.id, member)
	}

	return {
		party,
		member
	}
}

/**
 * Removes a member from a party
 * @param {*} partyId party to leave
 * @param {*} memberId member who is leaving
 */
const leaveParty = (partyId, memberId) => {
	const party = state.parties.get(partyId)
	if (!party) {
		return false
	}

	party.members.delete(memberId)
	state.players.delete(memberId)

	if (party.members.size < 1) {
		// everyone left
		state.parties.delete(partyId)
	} else {		
		if (party.leader.state.id === memberId) {
			// the leader left, promote next player
			const newLeader = party.members.values().next().value
			newLeader.state.isLeader = true
			party.leader = newLeader

			return { party, newLeader }
		}
	}

	return { party }
}

/**
 * Changes a state property on the player
 * @param {*} memberId 
 * @param {*} prop 
 * @param {*} value 
 */
const updatePlayer = (memberId, prop, value) => {
	const player = state.players.get(memberId)
	if (!player) {
		return false
	}
	player.state[prop] = value
	return true
}

/**
 * Refreshes a player's activity to keep them from going idle
 * @param {*} memberId 
 */
const refreshPlayer = (memberId) => {
	const player = state.players.get(memberId)
	if (!player) {
		return false
	}
	player.lastActive = Date.now() 
}

const interval = setInterval(() => {
	const now = Date.now()
	state.players.forEach(player => {
		player.socket.ping()
		if (now - player.lastActive > state.idleTimeoutMs) {
			state.idlePlayers.push(player)
		}
	})
}, state.tickIntervalMs)

/**
 * stops timers and releases memory, probably only useful for test suites
 * does not terminate sockets
 */
const dispose = () => {
	clearInterval(interval)
	state.parties = new Map()
	state.players = new Map()
	state.idlePlayers = []
}

module.exports = {
	createParty,
	joinParty,
	leaveParty,
	updatePlayer,
	refreshPlayer,
	dispose,
	state
}
