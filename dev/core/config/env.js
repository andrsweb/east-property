import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

export const isProd = Boolean(argv.prod);
export const skipLint = Object.prototype.hasOwnProperty.call(argv, 'lint') && argv.lint === false;
