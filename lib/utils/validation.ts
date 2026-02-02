import { z } from 'zod';

// Serbian phone number validation (06X XXX XXXX format)
const serbianPhoneRegex = /^06[0-9]\s?[0-9]{3}\s?[0-9]{3,4}$/;

export const loginSchema = z.object({
  username: z.string().min(1, 'Korisničko ime je obavezno'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Ime i prezime moraju imati najmanje 2 karaktera'),
    username: z.string().min(3, 'Korisničko ime mora imati najmanje 3 karaktera'),
    email: z.string().email('Nevažeća email adresa'),
    phone: z
      .string()
      .regex(serbianPhoneRegex, 'Format telefona: 06X XXX XXXX')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
    confirmPassword: z.string(),
    userRole: z.enum(['user', 'organization', 'family']).optional(),
    city: z.string().optional(),
    municipality: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne poklapaju',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (data.userRole === 'family') {
      const cityValue = data.city?.trim() || '';
      if (cityValue.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['city'],
          message: 'Grad je obavezan',
        });
      }
    }

    if (data.municipality && data.municipality.trim().length > 0 && data.municipality.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['municipality'],
        message: 'Opština mora imati najmanje 2 karaktera',
      });
    }
  });

export const adSchema = z.object({
  title: z.string().min(3, 'Naziv mora imati najmanje 3 karaktera'),
  description: z.string().min(10, 'Opis mora imati najmanje 10 karaktera'),
  categoryId: z.string().uuid('Molimo izaberite kategoriju'),
  condition: z.enum(['odlično', 'dobro', 'solidno']),
  imageUrls: z.array(z.string().url()).optional(),
});

export const familyRequestSchema = z.object({
  title: z.string().min(3, 'Naziv mora imati najmanje 3 karaktera'),
  description: z.string().min(10, 'Opis mora imati najmanje 10 karaktera'),
  categoryId: z.string().uuid('Molimo izaberite kategoriju'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AdInput = z.infer<typeof adSchema>;
export type FamilyRequestInput = z.infer<typeof familyRequestSchema>;

