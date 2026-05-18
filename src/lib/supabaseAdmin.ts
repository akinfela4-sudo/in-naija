import { createClient } from '@supabase/supabase-js';

// Base64 fallbacks for zero-config Vercel deployments
const decodeBase64 = (str: string) => {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'base64').toString('utf8');
  }
  return atob(str);
};

const B64_URL = 'aHR0cHM6Ly9jeG56dWNrYXB0bnppZmVveGlybi5zdXBhYmFzZS5jbw==';
const B64_SERVICE_KEY = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1ONGJucDFZMnRoY0hSdWVtbG1aVzk0YVhKdUlpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGMzT0RnM05Ua3lOQ3dpWlhod0lqb3lNRGswTkRVeE9USTBmUS5mdjZMLWYyVzYwSEZ2SHRvQVpncG16Rm9Obkw2VDl4VHo2MjRuWHZXTFY4';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || decodeBase64(B64_URL);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || decodeBase64(B64_SERVICE_KEY);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
