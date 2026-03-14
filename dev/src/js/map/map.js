import {importLibrary} from '@googlemaps/js-api-loader';
import Swiper from 'swiper';
import {Navigation} from 'swiper/modules';
import {MAP_CONFIG} from './config';
import {renderBuildingCard} from './html';

document.addEventListener('DOMContentLoaded', () => {
	const mapInstances = document.querySelectorAll('.js-map-instance');
	mapInstances.forEach(instance => {
		new PropertyMap(instance);
	});
});

export class PropertyMap {
	constructor(root) {
		this.root = root;
		this.container = root.querySelector('.js-map-container');
		if (!this.container) return;

		// читаем конфигурацию из дата артибуов самого компонента
		this.mode = root.dataset.mapMode || 'list';
		this.propertyId = root.dataset.propertyId;
		this.showSidebar = root.dataset.showSidebar !== 'false';

		this.lat = MAP_CONFIG.DEFAULT_CENTER.lat;
		this.lng = MAP_CONFIG.DEFAULT_CENTER.lng;

		this.map = null;
		this.sidebar = root.querySelector('.js-map-sidebar');
		this.sidebarContent = root.querySelector('.map-sidebar-content');
		this.sidebarClose = root.querySelector('.js-map-sidebar-close');
		this.sidebarTarget = root.querySelector('.js-sidebar-card-target');
		this.properties = [];
		this.markers = [];
		this.isDragging = false;
		this.startY = 0;
		this.currentTranslation = 0;

		// если сайдбар не нужен - сносим его к чертям собачьим
		if (!this.showSidebar && this.sidebar) {
			this.sidebar.remove();
			this.sidebar = null;
		}

		void this.init();
		this.initEvents();
	}

	async init() {
		try {
			const {Map} = await importLibrary('maps');
			const {AdvancedMarkerElement} = await importLibrary('marker');

			await this.loadProperties();

			// если сингл мод -- ищем точку в жсон
			if (this.mode === 'single' && this.propertyId) {
				const prop = this.properties.find(p => p.id.toString() === this.propertyId.toString());
				if (prop) {
					this.lat = parseFloat(prop.latitude);
					this.lng = parseFloat(prop.longtitude);
				}
			}

			// для одиночного режима зум побольше
			const zoom = this.mode === 'single' ? 14 : MAP_CONFIG.DEFAULT_ZOOM;

			this.map = new Map(this.container, {
				center: {lat: this.lat, lng: this.lng},
				zoom: zoom,
				mapId: MAP_CONFIG.MAP_ID,
				disableDefaultUI: true,
				zoomControl: false,
				gestureHandling: 'greedy'
			});

			if (this.mode === 'single') {
				this.renderSingleMarker(AdvancedMarkerElement);
			} else {
				this.renderMarkers(AdvancedMarkerElement);
			}

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

	renderSingleMarker(AdvancedMarkerElement) {
		const markerElement = document.createElement('div');
		markerElement.className = 'map-marker map-marker--single';
		markerElement.innerHTML = `<img src="/img/geo.svg" alt="Location">`;

		new AdvancedMarkerElement({
			map: this.map,
			position: {lat: this.lat, lng: this.lng},
			content: markerElement,
			title: 'Location'
		});
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
		if (!this.sidebar || !this.sidebarContent || !this.sidebarTarget) return;

		this.sidebar.classList.remove('is-hidden');
		this.sidebar.classList.add('is-loading');

		// Пока симуляция загрузки. Когда будешь аяксом грузить - можно лоадер этот дергать
		setTimeout(() => {
			this.sidebarTarget.innerHTML = renderBuildingCard(prop);
			this.sidebar.classList.remove('is-loading');
			this.initCardSlider();
		}, 1500);
	}

	initCardSlider() {
		const slider = this.root.querySelector('.building-card-slider');
		if (!slider) return;

		new Swiper(slider, {
			modules: [Navigation],
			slidesPerView: 1,
			loop: true,
			navigation: {
				nextEl: slider.querySelector('.swiper-next'),
				prevEl: slider.querySelector('.swiper-prev'),
			},
		});
	}

	initEvents() {
		if (this.sidebarClose) {
			this.sidebarClose.addEventListener('click', () => {
				this.sidebar.classList.add('is-hidden');
			});
		}

		if (this.sidebar) {
			const handle = this.sidebar.querySelector('.map-handle-wrapper');
			if (handle) {
				handle.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: true});
				window.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
				window.addEventListener('touchend', () => this.handleTouchEnd(), {passive: true});
			}
		}
	}

	handleTouchStart(e) {
		if (window.innerWidth >= 768) return;
		this.isDragging = true;
		this.startY = e.touches[0].clientY;
		this.sidebar.classList.add('is-dragging');
	}

	handleTouchMove(e) {
		if (!this.isDragging || window.innerWidth >= 768) return;

		const deltaY = e.touches[0].clientY - this.startY;
		if (deltaY < 0) return;

		e.preventDefault();
		this.currentTranslation = deltaY;
		this.sidebar.style.transform = `translateY(${deltaY}px)`;
	}

	handleTouchEnd() {
		if (!this.isDragging) return;

		this.isDragging = false;
		this.sidebar.classList.remove('is-dragging');
		this.sidebar.style.transform = '';

		if (this.currentTranslation > 150) {
			this.sidebar.classList.add('is-hidden');
		}

		this.currentTranslation = 0;
	}
}
