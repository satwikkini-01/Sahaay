const format = (level, ...args) => {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}]`;
  return [prefix, ...args];
};

const info = (...args) => console.log(...format('INFO', ...args));
const warn = (...args) => console.warn(...format('WARN', ...args));
const error = (...args) => console.error(...format('ERROR', ...args));
const debug = (...args) => console.debug(...format('DEBUG', ...args));

export default {
  info,
  warn,
  error,
  debug,
};
