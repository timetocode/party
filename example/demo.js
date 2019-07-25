import {
	joinParty,
	createParty,
	leaveParty,
	kick,
	start,
	submitChange,
	partyEvents
} from '../client/client'

import render from './render'

const updatePartyQuerystring = (partyId) => {
	let newurl = window.location.protocol + "//" + window.location.host
	if (!partyId) {
		window.history.replaceState({ path: newurl }, '', newurl)
		return
	}
	newurl += '?party=' + partyId
	window.history.replaceState({ path: newurl }, '', newurl)
}

const state = {
	partyId: null,
	memberId: null,
	isLeader: false,
	members: new Map()
}

const resetState = () => {
	state.partyId = null
	state.memberId = null
	state.isLeader = false
	state.members = new Map()
}


partyEvents.on('identity', identity => {
	state.partyId = identity.partyId
	state.memberId = identity.memberId
	state.isLeader = identity.isLeader
	window.localStorage.setItem('partyId', state.partyId)
	window.localStorage.setItem('memberId', state.memberId)
	render(state)
	updatePartyQuerystring(state.partyId)
})

partyEvents.on('create', member => {
	state.members.set(member.id, member)
	render(state)
})

partyEvents.on('update', (id, prop, value) => {
	const member = state.members.get(id)
	if (member) {
		member[prop] = value
	}
	render(state)
})

partyEvents.on('delete', id => {
	state.members.delete(id)
	render(state)
})

partyEvents.on('disconnect', () => {
	resetState()
	render(state)
})

partyEvents.on('party-not-found', () => {
	resetState()
	render(state)	
	updatePartyQuerystring(null)
})

partyEvents.on('start', (payload) => {
	console.log('start', payload)
	// TODO launch an actual game
	// e.g. startGame(payload.url, state.PartyId)
})

partyEvents.on('kicked', () => {
	console.log('we got kicked!!!')
	resetState()
	render(state)
})

window.onload = () => {
	const urlParams = new URLSearchParams(window.location.search)
	const partyId = urlParams.get('party')

	let socket = null
	if (partyId) {
		socket = joinParty('ws://localhost:8888', partyId, window.localStorage.getItem('memberId'))
	} 

	document.getElementById('createParty').addEventListener('click', () => {
		if (!state.partyId) {
			socket = createParty('ws://localhost:8888')
		}	
	})

	document.getElementById('leaveParty').addEventListener('click', () => {
		leaveParty(socket)
	})

	document.getElementById('start').addEventListener('click', () => {
		start(socket)
	})

	document.getElementById('submitName').addEventListener('click', () => {
		const newName = document.getElementById('name').value
		console.log('here', newName)
		submitChange(socket, 'name', newName)
	})

	// wiring up to the kick buttons
	window.addEventListener('kick', (ev) => {
		kick(socket, ev.detail)
	})
}
