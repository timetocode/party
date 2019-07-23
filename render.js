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
		if (state.isLeader && member.id !== state.memberId) {
			const kickButton = document.createElement('button')
			kickButton.innerText = 'Kick'
			div.appendChild(kickButton)
		
		}
		ele('members').appendChild(div)

	})

	// render log
	/*
	ele('log').innerHTML = ''
	state.log.forEach(entry => {
		const div = document.createElement('div')
		div.innerText = entry
		ele('log').append(div)
	})
	*/
}

export default render