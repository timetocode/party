import { EventEmitter } from 'events'

const state = {
	partyId: null,
	memberId: null,
	isLeader: false,
	members: new Map()
}

const resetState = () => {
	Object.assign(state, {
		partyId: null,
		memberId: null,
		isLeader: false,
		members: new Map(),
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

	partyEvents.emit('identity', state)
}

const onDelete = (data) => {
	state.members.delete(data.memberId)
	state.log.push(`Member removed ${data.memberId}`)
	partyEvents.emit('delete', data.memberId)
}

const onPartyNotFound = () => {
	resetState()
	partyEvents.emit('party-not-found')
}

const onCreate = (data) => {
	const member = Object.assign({}, data)
	delete member.action
	state.members.set(member.id, member)
	partyEvents.emit('create', member)
}

const onUpdate = (data) => {
	const member = state.members.get(data.memberId)
	if (member) {
		member[data.prop] = data.value
	}
	partyEvents.emit('update', data.memberId, data.prop, data.value)
}

const onStart = (data) => {
	const payload = Object.assign({}, data)
	delete payload.action
	partyEvents.emit('start', payload)
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

const onError = (event) => {
	console.log('socket error', event)
}

const joinParty = (wsUrl, partyId, memberId) =>  {
	const socket = new WebSocket(wsUrl)
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'joinParty', partyId, memberId }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('error', onError)
	socket.addEventListener('message', onMessage)
	return socket
}

const createParty = (wsUrl) => {
	const socket = new WebSocket(wsUrl)
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'createParty' }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('error', onError)
	socket.addEventListener('message', onMessage)
	return socket
}

const leaveParty = (socket) => {
	socket.send(JSON.stringify({ action: 'leaveParty' }))
	onClose()
}

const start = (socket) => {
	socket.send(JSON.stringify({ action: 'start' }))
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
