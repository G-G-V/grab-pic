// const { z } = require('zod');
import { z } from 'zod';

const presignSchema = z.object({
  filenames: z
    .array(z.string().min(1))
    .min(1, 'At least one filename is required.')
    .max(50, 'Cannot upload more than 50 photos at once.'),
});

const confirmUploadSchema = z.object({
  photoIds: z
    .array(z.string().uuid('Invalid photo ID.'))
    .min(1, 'At least one photo ID is required.'),
});

// module.exports = { presignSchema, confirmUploadSchema };
export { presignSchema, confirmUploadSchema };
