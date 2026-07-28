export default function sitemap() {
  const base = 'https://kazikwako.space';

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
