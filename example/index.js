const createPartyService = require('../server/createPartyService')

createPartyService({
	SERVICE_ID: '1-',
	PARTY_ID_TOKEN_SIZE: 4,
	PLAYER_ID_TOKEN_SIZE: 8,
	port: 8888,
	idleTimeoutMs: 1000,
	tickIntervalMs: 2000,
	playerProperties: ['name', 'foo', 'bar'],
	validators: {
		name(value) {
			console.log('name validator')
			return value
		},
		foo(value) {
			console.log('foo validator')
			return value
		},
		bar(value) {
			console.log('bar validator')
			return value
		},
	},
	onStart: (party) => {
		console.log('party is ready to play!')
		console.log(party)
		return {
			url: `https://us-west-5.sharkz.io/3`
		}
	}
})