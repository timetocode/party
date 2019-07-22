
/*
* Generates random url safe tokens
* *STATEFUL* tracks issued tokens to avoid collisions
* api: 
* 	generate(size)
*   release(token)
* */
const gen = require('nanoid/generate')
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const state = {
	tokens: {}
}

const generate = (size, prefix) => {
	const token = (prefix) ? `${prefix}-${gen(ALPHABET, size)}` : gen(ALPHABET, size)
	if (state.tokens[token]) {
		// a dupe? try again
		return generate(size, prefix)
	} else {
		state.tokens[token] = true
		return token
	}
}

const release = (token) => {
	delete state.tokens[token]
}

module.exports = {
	generate,
	release
}
