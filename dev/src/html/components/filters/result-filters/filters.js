import {loadSearchData} from '../../../../js/common/common.js'

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

		const dropdown = button.querySelector('.result-dropdown')

		if (!dropdown) return

		dropdown.hidden = true
		button.classList.remove('is-open')
	}

	const openDropdown = (button) => {
		if (!button) return
		if (openButton && openButton !== button) closeDropdown(openButton)

		openButton = button

		const dropdown = button.querySelector('.result-dropdown')

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
}