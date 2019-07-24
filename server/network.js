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

module.exports = {
	send,
	sendIdentity,
	sendCreateMember,
	sendUpdateMember,
	sendDeleteMember,
	sendStart
}
