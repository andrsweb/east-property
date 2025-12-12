document.addEventListener('DOMContentLoaded', () => {
	'use strict'

	initSearchTabs()
})

const initSearchTabs = () => {
	const containers = document.querySelectorAll('[data-search-tabs]')
	if (!containers.length) {
		return
	}

	containers.forEach((container) => {
		const tabs = Array.from(container.querySelectorAll('[data-search-tab]'))
		const typeField = container.querySelector('[data-search-type]')
		const availableText = container.querySelector('[data-search-available-text]')
		const priceText = container.querySelector('[data-search-price-text]')
		const panel = container.querySelector('[role="tabpanel"]')

		if (!tabs.length || !typeField || !availableText || !priceText || !panel) {
			return
		}

		tabs.forEach((tab) => {
			tab.addEventListener('click', () => {
				if (tab.classList.contains('is-active')) {
					return
				}

				tabs.forEach((item) => {
					item.classList.remove('is-active')
					item.setAttribute('aria-selected', 'false')
					item.setAttribute('tabindex', '-1')
				})

				tab.classList.add('is-active')
				tab.setAttribute('aria-selected', 'true')
				tab.setAttribute('tabindex', '0')
				panel.setAttribute('aria-labelledby', tab.id)

				const type = tab.dataset.type ?? ''
				const available = tab.dataset.available ?? ''
				const price = tab.dataset.price ?? ''

				typeField.value = type
				availableText.textContent = available
				priceText.textContent = price
			})
		})
	})
}