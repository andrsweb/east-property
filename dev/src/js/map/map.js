import {importLibrary} from '@googlemaps/js-api-loader';
import {MAP_CONFIG} from './config';

document.addEventListener('DOMContentLoaded', () => {
	if (document.getElementById('main-map')) new PropertyMap('main-map');
});

export class PropertyMap {
	constructor(containerId) {
		this.container = document.getElementById(containerId);
		if (!this.container) return;

		this.map = null;
		void this.init();
	}

	async init() {
		try {
			const {Map} = await importLibrary('maps');

			this.map = new Map(this.container, {
				center: MAP_CONFIG.DEFAULT_CENTER,
				zoom: MAP_CONFIG.DEFAULT_ZOOM,
				mapId: MAP_CONFIG.MAP_ID,
				disableDefaultUI: true,
				zoomControl: false,
			});
		} catch (error) {
			console.error('Error initializing Google Map:', error);
		}
	}
}
