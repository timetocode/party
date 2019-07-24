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
			kickButton.addEventListener('click', () => {
				console.log('clicked KICK', member.id)
			})	
		}
		ele('members').appendChild(div)
	})
}

export default render
