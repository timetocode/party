
import { EventEmitter } from 'events'

const state = {
	partyId: null,
	memberId: null,
	isLeader: false,
	members: new Map(),
	startCallback: () =>{},
	log: []
}

const resetState = () => {
	Object.assign(state, {
		partyId: null,
		memberId: null,
		isLeader: false,
		members: new Map(),
		log: []
	})
}


const partyEvents = new EventEmitter()

/* actions */
const onIdentity = (data) => {
	if (data.partyId) {
		state.partyId = data.partyId
	}
	if (data.memberId) {
		state.memberId = data.memberId
	}
	if (data.isLeader) {
		state.isLeader = data.isLeader
	}

	//partyEvents.emit('partyId', state.partyId)
	//partyEvents.emit('memberId', state.memberId)
	//partyEvents.emit('isLeader', state.isLeader)

	partyEvents.emit('identity', state)

	state.log.push(`Joined ${data.memberId} of party ${data.partyId}`)
}

const onDelete = (data) => {
	state.members.delete(data.memberId)
	state.log.push(`Member removed ${data.memberId}`)
	partyEvents.emit('delete', data.memberId)
}

const onPartyNotFound = () => {
	state.log.push(`Unable to join party.`)
	resetState()
	partyEvents.emit('party-not-found')

}

const onCreate = (data) => {
	console.log('onCreate', data)
	const member = Object.assign({}, data)
	delete member.action
	state.members.set(member.id, member)
	partyEvents.emit('create', member)
	state.log.push(`Member added ${member.id}`)
}

const onUpdate = (data) => {
	const member = state.members.get(data.memberId)
	if (member) {
		member[data.prop] = data.value
	}
	partyEvents.emit('update', data.memberId, data.prop, data.value)
}

const onStart = (data) => {
	const url = data.url
	console.log('Start GAME!', url)
	state.log.push(`Start game ${url}`)
	state.startCallback(url)
	// TODO: actually launch the game 
	// also save our partyId and pass it to the server if teams are a thing
}


/* router */
const actions = {
	identity: onIdentity,
	create: onCreate,
	delete: onDelete,
	'party-not-found': onPartyNotFound,
	start: onStart,
	update: onUpdate
}

const onMessage = (event) => {
	const data = JSON.parse(event.data)	
	const action = actions[data.action]
	if (typeof action === 'function') {
		action(data)
	} else {
		console.log('unknown action sent from party server')
	}	
}

const onClose = (event) => {
	resetState()
	partyEvents.emit('disconnect')
}

const onError = (event, b, c) => {
	console.log('socket error', event, b, c)
}

const joinParty = (partyId, memberId) =>  {
	const socket = new WebSocket('ws://localhost:8888')
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'joinParty', partyId, memberId }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('error', onError)
	socket.addEventListener('message', onMessage)
	return socket
}

const createParty = () => {
	const socket = new WebSocket('ws://localhost:8888')
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'createParty' }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('error', onError)
	socket.addEventListener('message', onMessage)
	return socket
}

const leaveParty = (socket, partyId, memberId) => {
	socket.send(JSON.stringify({ action: 'leaveParty', partyId, memberId }))
	onClose()
}

const start = (socket, partyId, startCallback) => {
	state.startCallback = startCallback
	socket.send(JSON.stringify({ action: 'start', partyId }))
}

const submitChange = (socket, prop, value) => {
	socket.send(JSON.stringify({ action: 'submitChange', prop, value }))
}

export {
	joinParty,
	createParty,
	leaveParty,
	start,
	partyEvents,
	submitChange
}