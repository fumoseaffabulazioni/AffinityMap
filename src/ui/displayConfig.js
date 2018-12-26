/**
 * Generate and handle display config panl in the interface.
 * It generate different configuration, depending on being displayed on
 * mobile, or if the interface is in private/public mode.
 */

import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import config from '../settings/config'
import { capitalize } from '../tools/generalTools'
import { CE } from '../elements/cachedElements'


const visibilityEntry = (fieldName, privateAccess, name = fieldName, requireCacheFlush) => ({
	name: capitalize(name),
	clbk(checked, map) {
		config.visibility[fieldName] = checked

		if (requireCacheFlush) {
			CE.flushNodes()
		}

		map.updateImage()
	},
	dft: config.visibility[fieldName],
	disabled: !privateAccess,
})


const configCats = [
	{
		name: 'Arrange by Affinities',
		children: undefined,
	},
	{
		name: 'Network Display',
		children: undefined,
	},
	{
		name: 'Labs Display',
		children: undefined,
	},
]


export default (map, privateAccess) => {
	const that = {
		panelId: 'displayConfigPanel',
		openButtonId: 'dcpOpenBtn',
		status: false,
	}

	const setAffinityCat = () => {
		// const affCat = configCats[0]//.find(o => o.name === 'Arrange Laboratories by:')
		configCats[0].children = a.orderedAcronyms().map(d => ({
			name: capitalize(a.name(d)),
			clbk(checked) {
				state.distances[d] = checked
				map.restart()
				CE.flushNodes()
			},
			dft: a.defaultStatus(d),
		}))
	}

	const setNetworkCat = privateAccess => {
		configCats[1]//.find(o => o.name === 'Network Display')
			.children =
			[['satellites'], ['institutions', undefined, true], ['keywords'], ['links', 'Links']]
				.map(d => visibilityEntry(d[0], privateAccess, d[1], d[2]))
		if (privateAccess) {
			configCats[1].children.push({
				name: 'ENAC+EPFL',
				clbk(checked) {
					state.enacOnly = !checked
					map.restart()
				},
				dft: !state.enacOnly,
				disabled: false,
			})
		}
	}

	const setNodeCat = privateAccess => {
		configCats[2]
			.children =
			[['chords', 'Diagram'], ['individuals'], ['labNames', 'Name'], ['acronym', 'Acronym'], ['headNames', 'Head']]
				.map(d => visibilityEntry(d[0], privateAccess, d[1], true))
	}

	that.closePanel = () => {
		that.status = false
		document.getElementById(that.panelId).classList.add('closed')
		document.getElementById(that.openButtonId).classList.add('closed')

		return that
	}

	that.init = () => {
		// use affinities from data to populate Affinites category
		setAffinityCat(privateAccess)

		if (!config.client.isMobile) {
			setNetworkCat(privateAccess)
			setNodeCat(privateAccess)
		}

		document.getElementById(that.openButtonId).addEventListener('click', () => {
			that.status = !that.status
			if (!that.status) {
				document.getElementById(that.panelId).classList.add('closed')
				document.getElementById(that.openButtonId).classList.add('closed')
			} else {
				document.getElementById(that.panelId).classList.remove('closed')
				document.getElementById(that.openButtonId).classList.remove('closed')
			}
		})

		// one div per category
		const divsSel = select(`#${that.panelId} #controls`).selectAll('div.contained').data(config.client.isMobile ? configCats.slice(0, 1) : configCats)
		const divs = divsSel.enter().append('div').merge(divsSel)

		divs.selectAll('h3')
			.data(d => [d])
			.enter().append('h3').text(d => d.name)

		// one div and span per element
		const intDivsSel = divs.selectAll('div').data(d => d.children.filter(c => !c.disabled))
		const intDivs = intDivsSel.enter().append('div').attr('class', 'tglBtnContainer')
			.merge(intDivsSel)


		const inputsSel = intDivs.selectAll('input').data(d => [d])
		const inputs = inputsSel.enter().append('input').attr('type', 'checkbox').attr('class', 'tgl tgl-ios').attr('id', d => `${d.name}-btn`)
			.merge(inputsSel)

		inputs
			.text(d => d.name)
			.property('checked', d => d.dft)
			.property('disabled', d => d.disabled)
			.filter(d => d.clbk).each(function (d) {
				select(this).on('change', () => {
					const checked = select(this).property('checked')
					d.clbk(checked, map)
				})
			})


		const labelsSel = intDivs.selectAll('label').data(d => [d])
		labelsSel.enter().append('label').attr('class', 'tgl-btn').attr('for', d => `${d.name}-btn`)

		const textsSel = intDivs.selectAll('text').data(d => [d])
		textsSel.enter().append('text').text(d => d.name)


		return that
	}

	return that
}