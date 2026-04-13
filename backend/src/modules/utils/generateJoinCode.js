// const crypto = require('crypto');
import crypto from 'crypto';

/**
 * Generates a random 6-character alphanumeric join code for events
 */
export const generateJoinCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
};

// // module.exports = { generateJoinCode };
// export { generateJoinCode };
