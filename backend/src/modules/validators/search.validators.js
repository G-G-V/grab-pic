import { z } from 'zod';

const base64Regex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
const dataUrlRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/;

const searchSchema = z
  .object({
    imageBase64: z
      .string()
      .refine((val) => dataUrlRegex.test(val) || base64Regex.test(val), {
        message: 'Invalid base64 format.',
      })
      .optional(),
    imageUrl: z.string().url('Invalid image URL.').optional(),
  })
  .refine((data) => !!(data.imageBase64 || data.imageUrl), {
    message: 'Either imageBase64 or imageUrl must be provided.',
  })
  .refine((data) => !(data.imageBase64 && data.imageUrl), {
    message: 'Provide only one of imageBase64 or imageUrl, not both.',
  });

export { searchSchema };
