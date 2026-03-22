import {loadSearchData} from './common/common.js'
import {getBedsBathsText, updateBedsBathsButtons, syncTempBedsBaths} from './common/beds-baths.js'

document.addEventListener('DOMContentLoaded', () => {
    'use strict'

    void initSearchResultsFilters()
    initPropertiesFilters()
})

const initSearchResultsFilters = async () => {
    const buttons = Array.from(document.querySelectorAll('.result-filter[data-filter]'))

    if (!buttons.length) return

    let searchData = searchTabsData;

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
        button.dispatchEvent(new Event('change', {bubbles: true}));

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
            check.src = '/wp-content/themes/east-property/assets/img/check.svg'
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
            const filterKey = button.dataset.filter

            if (!option) {
                if (button.classList.contains('is-open')) {
                    closeDropdown(button)
                    openButton = null
                    return
                }

                openDropdown(button)

                if (filterKey === 'beds_baths') {
                    window.dispatchEvent(new CustomEvent('filter:open', {detail: {filter: filterKey}}))
                }
                return
            }

            const selectedValue = option.getAttribute('data-value')

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

        if (openButton.contains(target) || target.closest('[data-result-dropdown]')) return

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
        console.log(searchData.filters);
        if (0 < searchData.filters.beds?.options.length) {
            searchData.filters.beds.options.forEach(bed => {
                if (bed.active) {
                    selectedBeds.add(bed.value)
                }
            });
        }
        let selectedBaths = new Set()
        if (0 < searchData.filters.baths?.options.length) {
            searchData.filters.baths.options.forEach(bath => {
                if (bath.active) {
                    selectedBaths.add(bath.value)
                }
            });
        }
        let tempBeds = new Set(selectedBeds)
        let tempBaths = new Set(selectedBaths)

        const updateDisplayText = () => {
            bedsBathsText.textContent = getBedsBathsText(selectedBeds, selectedBaths)
            bedsValueInput.value = Array.from(selectedBeds).join(',')
            bathsValueInput.value = Array.from(selectedBaths).join(',')
        }

        const updateButtonStates = () => {
            updateBedsBathsButtons(bedsBathsDropdown, tempBeds, tempBaths)
        }

        updateDisplayText()

        window.addEventListener('filter:open', (e) => {
            if (e.detail.filter === 'beds_baths') {
                const synced = syncTempBedsBaths(selectedBeds, selectedBaths)
                tempBeds = synced.tempBeds
                tempBaths = synced.tempBaths
                updateButtonStates()
            }
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
                const synced = syncTempBedsBaths(selectedBeds, selectedBaths)
                tempBeds = synced.tempBeds
                tempBaths = synced.tempBaths
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
                updatePropertiesList();
            })
        }
    }
}

const initPropertiesFilters = () => {
    const filterItem = document.querySelector('.results-filters-items');
    if (!filterItem) return

    let filterButtons = filterItem.querySelectorAll('button.result-filter');
    if (!filterButtons) return

    filterButtons.forEach(button => {
        button.addEventListener('change', () => {
            updatePropertiesList();
        });
    });
}

const updatePropertiesList = () => {
    const filterItem = document.querySelector('.results-filters-items');
    let filterButtons = filterItem.querySelectorAll('button.result-filter'),
        formData = new FormData(),
        resultsBlock = document.getElementById('result-tabs-list-panel'),
        contentList = resultsBlock.querySelector('.content-list'),
        contentScroll = document.querySelector('.result-tabs-content-inner .content-scroll'),
        resultTabs = document.querySelector('.result-tabs'),
        h2Block = resultsBlock.querySelector('.title-top h2'),
        bedsValueInput = filterItem.querySelector('input[name="beds"]'),
        bathsValueInput = filterItem.querySelector('input[name="baths"]'),
        action = filterItem.querySelector('input[name="action"]');

    resultTabs.classList.add('preloader');

    formData.append('action', action.value ?? 'get_properties');
    formData.append('_ajax_nonce', ajax_object._ajax_nonce);
    filterButtons.forEach(button => {
        formData.append(button.dataset.filter, button.dataset.selectedValue);
    });

    if (bedsValueInput) {
        formData.append('beds', bedsValueInput.value);
    }

    if (bathsValueInput) {
        formData.append('baths', bathsValueInput.value);
    }

    fetch(ajax_object.ajax_url, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                contentList.innerHTML = response.data.properties;
                contentScroll.innerHTML = response.data.map_properties;
                h2Block.innerHTML = response.data.properties_found;
            }
            setTimeout(() => {
                resultTabs.classList.remove('preloader');
                document.dispatchEvent(new Event('ajaxComplete'));
            }, 600);
        })
        .catch(error => {
            console.log(error);
            resultTabs.classList.remove('preloader');
        });
}