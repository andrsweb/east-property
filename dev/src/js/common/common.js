import {SEARCH_DATA_URL} from './global.js';

document.addEventListener('DOMContentLoaded', () => {
	'use strict'
})

export const loadSearchData = (() => {
	let cache = null
	return async () => {
		if (cache) return cache

		cache = fetch(SEARCH_DATA_URL, {cache: 'no-cache'}).then(async (res) => {
			if (!res.ok) throw new Error(`Failed to load search data: ${res.status}`)

			return res.json()
		})
		return cache
	}
})()