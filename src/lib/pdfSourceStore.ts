const PDF_SOURCES_KEY = 'chemanalyst-pdf-sources';

export interface PdfSource {
  id: string;
  name: string;
  text: string;
  uploadedAt: string;
  pageCount: number;
}

export function getPdfSources(): PdfSource[] {
  try {
    const raw = localStorage.getItem(PDF_SOURCES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPdfSource(source: PdfSource): void {
  const sources = getPdfSources();
  const idx = sources.findIndex(s => s.name === source.name);
  if (idx >= 0) sources[idx] = source;
  else sources.push(source);
  localStorage.setItem(PDF_SOURCES_KEY, JSON.stringify(sources));
  window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: PDF_SOURCES_KEY } }));
}

export function removePdfSource(id: string): void {
  const sources = getPdfSources().filter(s => s.id !== id);
  localStorage.setItem(PDF_SOURCES_KEY, JSON.stringify(sources));
  window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: PDF_SOURCES_KEY } }));
}

/** Smart contextual search — finds sentences containing query terms */
export function searchPdfSources(query: string): { source: string; excerpts: string[] }[] {
  const sources = getPdfSources();
  if (!sources.length || !query.trim()) return [];

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];

  const results: { source: string; excerpts: string[] }[] = [];

  for (const src of sources) {
    const textLower = src.text.toLowerCase();
    const matchedTerms = terms.filter(t => textLower.includes(t));
    if (matchedTerms.length === 0) continue;

    const excerpts: string[] = [];
    const sentences = src.text.split(/[.!?\n]+/).filter(s => s.trim().length > 10);

    for (const sentence of sentences) {
      const sentLower = sentence.toLowerCase();
      if (matchedTerms.some(t => sentLower.includes(t))) {
        excerpts.push(sentence.trim());
        if (excerpts.length >= 5) break;
      }
    }

    if (excerpts.length) {
      results.push({ source: src.name, excerpts });
    }
  }

  return results;
}

/** Exact word match search — finds sentences containing the exact query phrase */
export function searchPdfSourcesExact(query: string): { source: string; excerpts: string[] }[] {
  const sources = getPdfSources();
  if (!sources.length || !query.trim()) return [];

  const exactPhrase = query.trim().toLowerCase();
  const results: { source: string; excerpts: string[] }[] = [];

  for (const src of sources) {
    const textLower = src.text.toLowerCase();
    if (!textLower.includes(exactPhrase)) continue;

    const excerpts: string[] = [];
    const sentences = src.text.split(/[.!?\n]+/).filter(s => s.trim().length > 10);

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(exactPhrase)) {
        excerpts.push(sentence.trim());
        if (excerpts.length >= 8) break;
      }
    }

    if (excerpts.length) {
      results.push({ source: src.name, excerpts });
    }
  }

  return results;
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(text);
  }

  return { text: pages.join('\n\n'), pageCount: pdf.numPages };
}
