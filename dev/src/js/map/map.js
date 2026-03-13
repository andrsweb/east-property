import {importLibrary} from '@googlemaps/js-api-loader';
import Swiper from 'swiper';
import {Navigation} from 'swiper/modules';
import {MAP_CONFIG} from './config';
import {renderBuildingCard} from './html';

document.addEventListener('DOMContentLoaded', () => {
	const mapElement = document.getElementById('main-map');
	if (mapElement) {
		window.appMap = new PropertyMap('main-map');
	}

	const closeBtn = document.getElementById('map-sidebar-close');
	const sidebar = document.getElementById('map-sidebar');

	if (closeBtn && sidebar) {
		closeBtn.addEventListener('click', () => {
			sidebar.classList.add('is-hidden');
		});
	}
});

export class PropertyMap {
	constructor(containerId) {
		this.container = document.getElementById(containerId);
		if (!this.container) return;

		this.map = null;
		this.sidebar = document.getElementById('map-sidebar');
		this.sidebarContent = document.querySelector('.map-sidebar-content');
		this.properties = [];
		this.markers = [];

		void this.init();
	}

	async init() {
		try {
			const {Map} = await importLibrary('maps');
			const {AdvancedMarkerElement} = await importLibrary('marker');

			this.map = new Map(this.container, {
				center: MAP_CONFIG.DEFAULT_CENTER,
				zoom: MAP_CONFIG.DEFAULT_ZOOM,
				mapId: MAP_CONFIG.MAP_ID,
				disableDefaultUI: true,
				zoomControl: false,
				gestureHandling: 'greedy'
			});

			await this.loadProperties();
			this.renderMarkers(AdvancedMarkerElement);

		} catch (error) {
			console.error('Error initializing Google Map:', error);
		}
	}

	async loadProperties() {
		try {
			const response = await fetch(MAP_CONFIG.DATA_URL);
			const data = await response.json();

			this.properties = Array.isArray(data) ? data : [data];
		} catch (error) {
			console.error('Error loading properties:', error);
		}
	}

	renderMarkers(AdvancedMarkerElement) {
		this.properties.forEach(prop => {
			const lat = parseFloat(prop.latitude);
			const lng = parseFloat(prop.longtitude);

			if (isNaN(lat) || isNaN(lng)) return;

			const markerElement = document.createElement('div');
			markerElement.className = 'map-marker';
			markerElement.innerHTML = `<span>${prop.units_available}</span>`;

			const marker = new AdvancedMarkerElement({
				map: this.map,
				position: {lat, lng},
				content: markerElement,
				title: prop.name
			});

			marker.addListener('click', () => {
				this.openSidebar(prop);
			});

			this.markers.push(marker);
		});
	}

	openSidebar(prop) {
		if (!this.sidebar || !this.sidebarContent) return;

		const target = document.getElementById('sidebar-card-target');
		if (!target) return;

		this.sidebar.classList.remove('is-hidden');
		this.sidebar.classList.add('is-loading');

		// Пока симуляция загрузки. Когда будешь аяксом грузить - можно лоадер этот дергать
		setTimeout(() => {
			target.innerHTML = renderBuildingCard(prop);
			this.sidebar.classList.remove('is-loading');
			this.initCardSlider();
		}, 1500);
	}

	initCardSlider() {
		new Swiper('.building-card-slider', {
			modules: [Navigation],
			slidesPerView: 1,
			loop: true,
			navigation: {
				nextEl: '.building-card-slider .swiper-next',
				prevEl: '.building-card-slider .swiper-prev',
			},
		});
	}
}
