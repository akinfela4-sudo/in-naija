import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://in-naija.vercel.app';

  // Fetch all published articles for the sitemap
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published');

  const articleEntries = (articles || []).map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.updated_at),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/elections`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/polls`,
      lastModified: new Date(),
    },
    ...articleEntries,
  ];
}
