const state = {
	partyId: null,
	memberId: null,
	isLeader: false,
	members: new Map(),
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
	state.log.push(`Joined ${data.memberId} of party ${data.partyId}`)
}

const onDelete = (data) => {
	state.members.delete(data.memberId)
	state.log.push(`Member removed ${data.memberId}`)
}

const onPartyNotFound = (data) => {
	state.log.push(`Unable to join party.`)
}

const onCreate = (data) => {
	const member = Object.assign({}, data)
	delete member.type
	state.members.set(member.id, member)
	state.log.push(`Member added ${member.id}`)
}


/* router */
const actions = {
	identity: onIdentity,
	create: onCreate,
	delete: onDelete,
	'party-not-found': onPartyNotFound
}

const onMessage = (event) => {
	const data = JSON.parse(event.data)
	
	const action = actions[data.type]
	if (typeof action === 'function') {
		action(data)
		render(state)
	} else {
		console.log('unknown action sent from party server')
	}	
}

const onClose = (event) => {
	console.log('close event', event)
	resetState()
	render(state)
}

const joinParty = (partyId) =>  {
	const socket = new WebSocket('ws://localhost:8888')
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'joinParty', partyId }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('message', onMessage)
	return socket
}

const createParty = () => {
	const socket = new WebSocket('ws://localhost:8888')
	socket.addEventListener('open', () => {
		socket.send(JSON.stringify({ action: 'createParty' }))
	})
	socket.addEventListener('close', onClose)
	socket.addEventListener('message', onMessage)
	return socket
}

const leaveParty = (socket, partyId, memberId) => {
	socket.send(JSON.stringify({ action: 'leaveParty', partyId, memberId }))
	onClose()
}


/* this line onwards is the debug interface! replace me */
const createMemberElement = (prop, value) => {
	const div = document.createElement('div')
	div.innerText = `${prop}: ${value}`
	return div
}

const ele = (id) => { return document.getElementById(id) }

const render = (state) => {
	ele('partyId').innerText = state.partyId
	ele('partyLink').href = `/?party=${state.partyId}`
	ele('memberId').innerText = state.memberId
	ele('isLeader').innerText = state.isLeader

	// render members
	ele('members').innerHTML = ''
	state.members.forEach(member => {
		const div = document.createElement('div')
		for (let prop in member) {
			const propEle = createMemberElement(prop, member[prop])
			div.appendChild(propEle)
		}
		ele('members').appendChild(div)
	})

	// render log
	ele('log').innerHTML = ''
	state.log.forEach(entry => {
		const div = document.createElement('div')
		div.innerText = entry
		ele('log').append(div)
	})
}

window.onload = () => {
	/**
	 * `party` is in the url: join that party
	 * `createParty` button pressed: create a new party
	 * `leaveParty` button pressed: leave the party
	 */
	const urlParams = new URLSearchParams(window.location.search)
	const partyId = urlParams.get('party')

	let socket = null
	if (partyId) {
		socket = joinParty(partyId)
	} else {
		document.getElementById('createParty').addEventListener('click', () => {
			socket = createParty()
		})
	}

	document.getElementById('leaveParty').addEventListener('click', () => {
		leaveParty(socket, state.partyId, state.memberId)
	})
}
