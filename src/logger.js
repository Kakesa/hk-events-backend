export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.cli(),
  transports:  [new winston.transports.Console()],
});