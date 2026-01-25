import { loadSearchData } from '../../../../js/common/common.js'

document.addEventListener('DOMContentLoaded', () => {
	'use strict'

	void initSearchResultsFilters()
})

const initSearchResultsFilters = async () => {
	const buttons = Array.from(document.querySelectorAll('.result-filter[data-filter]'))

	if (!buttons.length) return

	let searchData
	try {
		searchData = await loadSearchData()
	} catch {
		return
	}

	const filters = searchData?.filters

	if (!filters) return

	const ensureValueTextSpan = (valueEl) => {
		const existing = valueEl.querySelector('[data-value-text]')

		if (existing) return existing

		const img = valueEl.querySelector('img')
		const span = document.createElement('span')

		span.setAttribute('data-value-text', 'true')
		span.textContent = (valueEl.textContent ?? '').trim()
		valueEl.replaceChildren()
		valueEl.append(span)

		if (img) valueEl.append(img)

		return span
	}

	const getInitialValue = (filterKey, options, currentLabel) => {
		const normalized = currentLabel.trim().toLowerCase()
		const byLabel = options.find((opt) => (opt?.label ?? '').trim().toLowerCase() === normalized)

		if (byLabel?.value) return byLabel.value
		return options[0]?.value ?? ''
	}

	const getLabelByValue = (filterKey, value) => {
		const options = filters?.[filterKey]?.options

		if (!Array.isArray(options)) return value

		return options.find((opt) => opt?.value === value)?.label ?? value
	}

	const applySelection = (button, filterKey, selectedValue) => {
		button.dataset.selectedValue = selectedValue
		const valueEl = button.querySelector('.result-value')

		if (!valueEl) return

		const textSpan = ensureValueTextSpan(valueEl)
		textSpan.textContent = getLabelByValue(filterKey, selectedValue)
	}

	const renderDropdown = (button) => {
		const filterKey = button.dataset.filter
		if (!filterKey) return

		const options = filters?.[filterKey]?.options

		if (!Array.isArray(options) || !options.length) return

		const dropdown = button.querySelector('.result-dropdown')

		if (!dropdown) return

		dropdown.replaceChildren()

		const selectedValue = button.dataset.selectedValue ?? ''

		options.forEach((opt) => {
			const optBtn = document.createElement('button')
			optBtn.type = 'button'
			optBtn.className = 'result-option'
			optBtn.setAttribute('data-value', opt.value)

			const text = document.createElement('span')
			text.textContent = opt.label

			const check = document.createElement('img')
			check.className = 'result-option-check'
			check.src = '/img/check.svg'
			check.width = 16
			check.height = 16
			check.alt = 'Selected'

			if (opt.value === selectedValue) optBtn.classList.add('is-selected')

			optBtn.append(text, check)
			dropdown.append(optBtn)
		})

		dropdown.hidden = true
	}

	buttons.forEach((button) => {
		const filterKey = button.dataset.filter

		if (!filterKey) return

		const options = filters?.[filterKey]?.options

		if (!Array.isArray(options) || !options.length) return

		const valueEl = button.querySelector('.result-value')

		if (!valueEl) return

		const textSpan = ensureValueTextSpan(valueEl)
		const initialValue = getInitialValue(filterKey, options, textSpan.textContent ?? '')

		applySelection(button, filterKey, initialValue)
		renderDropdown(button)
	})

	let openButton = null

	const closeDropdown = (button) => {
		if (!button) return
		const filterKey = button.dataset.filter

		const dropdown = button.querySelector('.result-dropdown') ||
			button.parentElement.querySelector(`[data-result-dropdown="${filterKey}"]`)

		if (!dropdown) return

		dropdown.hidden = true
		button.classList.remove('is-open')
	}

	const openDropdown = (button) => {
		if (!button) return
		const filterKey = button.dataset.filter
		if (openButton && openButton !== button) closeDropdown(openButton)

		openButton = button

		const dropdown = button.querySelector('.result-dropdown') ||
			button.parentElement.querySelector(`[data-result-dropdown="${filterKey}"]`)

		if (!dropdown) return

		dropdown.hidden = false
		button.classList.add('is-open')
	}

	buttons.forEach((button) => {
		button.addEventListener('click', (e) => {
			const target = e.target
			if (!target || typeof target.closest !== 'function') return

			const option = target.closest('.result-option')
			if (!option) {
				if (button.classList.contains('is-open')) {
					closeDropdown(button)
					openButton = null
					return
				}

				openDropdown(button)
				return
			}

			const selectedValue = option.getAttribute('data-value')
			const filterKey = button.dataset.filter

			if (filterKey && selectedValue) {
				applySelection(button, filterKey, selectedValue)
				renderDropdown(button)
			}

			closeDropdown(button)
			openButton = null
		})
	})

	document.addEventListener('click', (e) => {
		if (!openButton) return
		const target = e.target
		if (!target) return

		if (openButton.contains(target)) return

		closeDropdown(openButton)
		openButton = null
	})

	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return
		if (!openButton) return

		closeDropdown(openButton)
		openButton = null
	})

	const bedsBathsSelector = document.querySelector('.result-filter[data-filter="beds_baths"]')
	const bedsBathsDropdown = document.querySelector('[data-result-dropdown="beds_baths"]')
	const bedsBathsText = document.querySelector('[data-result-beds-baths-text]')
	const bedsValueInput = document.querySelector('[data-result-beds-value]')
	const bathsValueInput = document.querySelector('[data-result-baths-value]')

	if (bedsBathsSelector && bedsBathsDropdown && bedsBathsText && bedsValueInput && bathsValueInput) {
		let selectedBeds = new Set()
		let selectedBaths = new Set()
		let tempBeds = new Set(selectedBeds)
		let tempBaths = new Set(selectedBaths)

		const updateDisplayText = () => {
			const bedsArray = Array.from(selectedBeds).sort()
			const bathsArray = Array.from(selectedBaths).sort()

			let text = ''
			if (bedsArray.length > 0) {
				text += bedsArray.join(',') + ' bed' + (bedsArray.length > 1 || bedsArray.includes('5+') ? 's' : '')
			}
			if (bathsArray.length > 0) {
				if (text) text += ', '
				text += bathsArray.join(',') + ' bath' + (bathsArray.length > 1 || bathsArray.includes('5+') ? 's' : '')
			}

			bedsBathsText.textContent = text || 'Select'
			bedsValueInput.value = bedsArray.join(',')
			bathsValueInput.value = bathsArray.join(',')
		}

		const updateButtonStates = () => {
			const bedButtons = bedsBathsDropdown.querySelectorAll('[data-beds]')
			const bathButtons = bedsBathsDropdown.querySelectorAll('[data-baths]')

			bedButtons.forEach(btn => {
				const value = btn.dataset.beds
				btn.classList.toggle('active', tempBeds.has(value))
			})

			bathButtons.forEach(btn => {
				const value = btn.dataset.baths
				btn.classList.toggle('active', tempBaths.has(value))
			})
		}

		bedsBathsSelector.addEventListener('click', (e) => {
			if (e.target.closest('.beds-baths-dropdown')) return

			setTimeout(() => {
				if (bedsBathsSelector.classList.contains('is-open')) {
					tempBeds = new Set(selectedBeds)
					tempBaths = new Set(selectedBaths)
					updateButtonStates()
				}
			}, 0)
		})

		bedsBathsDropdown.addEventListener('click', (e) => {
			e.stopPropagation()
			const bedBtn = e.target.closest('[data-beds]')
			const bathBtn = e.target.closest('[data-baths]')

			if (bedBtn) {
				const value = bedBtn.dataset.beds
				if (tempBeds.has(value)) {
					tempBeds.delete(value)
				} else {
					tempBeds.add(value)
				}
				updateButtonStates()
			}

			if (bathBtn) {
				const value = bathBtn.dataset.baths
				if (tempBaths.has(value)) {
					tempBaths.delete(value)
				} else {
					tempBaths.add(value)
				}
				updateButtonStates()
			}
		})

		const cancelBtn = bedsBathsDropdown.querySelector('.beds-baths-cancel')
		if (cancelBtn) {
			cancelBtn.addEventListener('click', (e) => {
				e.preventDefault()
				e.stopPropagation()
				tempBeds = new Set(selectedBeds)
				tempBaths = new Set(selectedBaths)
				updateButtonStates()
				closeDropdown(bedsBathsSelector)
				openButton = null
			})
		}

		const applyBtn = bedsBathsDropdown.querySelector('.beds-baths-apply')
		if (applyBtn) {
			applyBtn.addEventListener('click', (e) => {
				e.preventDefault()
				e.stopPropagation()
				selectedBeds = new Set(tempBeds)
				selectedBaths = new Set(tempBaths)
				updateDisplayText()
				closeDropdown(bedsBathsSelector)
				openButton = null
			})
		}

		updateDisplayText()
	}
}