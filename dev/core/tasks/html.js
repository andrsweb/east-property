import gulp from 'gulp';
import dotenv from 'dotenv';

dotenv.config();
import plumber from 'gulp-plumber';
import fileInclude from 'gulp-file-include';
import {paths} from '../config/paths.js';
import {createErrorHandler} from '../config/utils.js';
import {browserSync} from '../config/server.js';

const {src, dest} = gulp;

export function html() {
	return src(paths.html.src)
		.pipe(plumber({errorHandler: createErrorHandler('HTML')}))
		.pipe(
			fileInclude({
				prefix: '@@',
				basepath: 'dev/src/html',
				indent: true,
				context: {
					GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
					GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID
				}
			})
		)
		.pipe(dest(paths.html.dest))
		.pipe(browserSync.stream());
}
