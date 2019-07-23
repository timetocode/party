import {
	joinParty,
	createParty,
	leaveParty,
	start,
	submitChange,
	partyEvents
} from './client'

import render from './render'

const updatePartyQuerystring = (partyId) => {
	console.log('query string changing...')
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
	console.log('update', id, prop, value)
	const member = state.members.get(id)
	if (member) {
		member[prop] = value
	}
	//state.members.set(member.id, member)
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
		console.log('did not bind create', partyId)
		socket = joinParty(partyId, window.localStorage.getItem('memberId'))
	} 

	document.getElementById('createParty').addEventListener('click', () => {
		if (!state.partyId) {
			socket = createParty()
		}	
	})

	document.getElementById('leaveParty').addEventListener('click', () => {
		leaveParty(socket, state.partyId, state.memberId)
	})

	document.getElementById('start').addEventListener('click', () => {
		start(socket, state.partyId, (url) => {
			console.log('told to start game!!', url)
		})
	})

	document.getElementById('submitName').addEventListener('click', () => {
		const newName = document.getElementById('name').value
		console.log('here', newName)
		submitChange(socket, 'name', newName)
	})
}
