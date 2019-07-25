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
	send(socket, { action: 'delete', memberId })
}

const sendStart = (socket, data) => {
	const payload = { action: 'start' }
	Object.assign(payload, data)
	send(socket, payload)
}

const sendKicked = (socket) => {
	send(socket, { action: 'kicked' })
}

module.exports = {
	send,
	sendIdentity,
	sendCreateMember,
	sendUpdateMember,
	sendDeleteMember,
	sendKicked,
	sendStart
}
