const gen = require('nanoid/generate')
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const state = {
	tokens: {}
}

/**
 * Generates random url safe tokens
 * @param {*} size size of the token in characters
 * @param {*} prefix (optional) string prefix
 */
const generate = (size, prefix) => {
	const token = (prefix) ? `${prefix}${gen(ALPHABET, size)}` : gen(ALPHABET, size)
	if (state.tokens[token]) {
		// a dupe? try again
		return generate(size, prefix)
	} else {
		state.tokens[token] = true
		return token
	}
}

/**
 * Releases a token (token can be reused in the future)
 * @param {*} token 
 */
const release = (token) => {
	delete state.tokens[token]
}

/**
 * clears all state
 */
const dispose = () => {
	state.tokens = {}
}

module.exports = {
	generate,
	release,
	dispose
}
