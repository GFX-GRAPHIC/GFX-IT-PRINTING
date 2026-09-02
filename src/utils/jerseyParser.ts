import { JerseyPlayerItem, JerseySizeGroup, JerseyMatrixSummary, JerseySleeveType, JerseyRoleType } from '../types';

export const STANDARD_SIZE_ORDER: string[] = [
  'BABY',
  'ANAK 1-2 TAHUN',
  'ANAK 2 TAHUN',
  'ANAK 3-4 TAHUN',
  'ANAK 5-6 TAHUN',
  'ANAK 7-8 TAHUN',
  'ANAK 9-10 TAHUN',
  'ANAK 11-12 TAHUN',
  'ANAK 13-14 TAHUN',
  'KIDS 2',
  'KIDS 4',
  'KIDS 6',
  'KIDS 8',
  'KIDS 10',
  'KIDS 12',
  'KIDS 14',
  'KIDS S',
  'KIDS M',
  'KIDS L',
  'KIDS XL',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
  'ALL SIZE',
  'CUSTOM',
];

/**
 * Normalizes size strings (e.g., "size anak 7-8 tahun" -> "ANAK 7-8 TAHUN", "2xl" -> "XXL", "s" -> "S")
 */
export function normalizeJerseySize(rawSize: string): string {
  if (!rawSize) return 'L';
  let clean = rawSize.trim().toUpperCase().replace(/[\(\)\[\]]/g, '');

  // 1. Adult standard conversions
  if (clean === '2XL') return 'XXL';
  if (clean === '3XL' || clean === 'XXXL') return '3XL';
  if (clean === '4XL' || clean === 'XXXXL') return '4XL';
  if (clean === '5XL' || clean === 'XXXXXL') return '5XL';
  if (clean === '6XL') return '6XL';

  // 2. Kids with range / years (e.g., "ANAK 7-8 TAHUN", "ANAK 3-4 TAHUN", "ANAK 2 TAHUN", "KIDS 7-8 TH")
  const rangeMatch = clean.match(/(?:ANAK|KIDS?|USIA)?\s*(\d{1,2})\s*[\-\/]\s*(\d{1,2})\s*(?:TAHUN|THN|TH|Y|YO|BLN|BULAN)?/i);
  if (rangeMatch) {
    return `ANAK ${rangeMatch[1]}-${rangeMatch[2]} TAHUN`;
  }

  const singleYearMatch = clean.match(/(?:ANAK|KIDS?|USIA)\s*(\d{1,2})\s*(?:TAHUN|THN|TH|Y|YO)?/i);
  if (singleYearMatch) {
    return `ANAK ${singleYearMatch[1]} TAHUN`;
  }

  const yearOnlyMatch = clean.match(/(\d{1,2})\s*(?:TAHUN|THN|TH)/i);
  if (yearOnlyMatch) {
    return `ANAK ${yearOnlyMatch[1]} TAHUN`;
  }

  const kidsNumMatch = clean.match(/(?:KIDS?|ANAK|SIZE|SZ|NO)\s*(\d{1,2})/i);
  if (kidsNumMatch && (clean.includes('ANAK') || clean.includes('KID') || parseInt(kidsNumMatch[1], 10) <= 16)) {
    const num = kidsNumMatch[1];
    if (['2', '4', '6', '8', '10', '12', '14', '16'].includes(num)) {
      return `KIDS ${num}`;
    }
  }

  if (['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'ALL SIZE'].includes(clean)) {
    return clean;
  }

  // Exact whole word check for adult sizes
  if (/\bXXL\b/i.test(clean) || /\b2XL\b/i.test(clean)) return 'XXL';
  if (/\b3XL\b/i.test(clean) || /\bXXXL\b/i.test(clean)) return '3XL';
  if (/\b4XL\b/i.test(clean)) return '4XL';
  if (/\b5XL\b/i.test(clean)) return '5XL';
  if (/\bXL\b/i.test(clean)) return 'XL';
  if (/\bXS\b/i.test(clean)) return 'XS';
  if (/\bS\b/i.test(clean)) return 'S';
  if (/\bM\b/i.test(clean)) return 'M';
  if (/\bL\b/i.test(clean)) return 'L';

  return clean;
}

/**
 * Helper to parse sleeve type with whole word boundaries
 */
export function parseSleeveType(text: string): JerseySleeveType {
  const lower = text.toLowerCase();
  if (/\b(lengan\s*panjang|tangan\s*panjang|long\s*sleeve|panjang|pjg|pndjg)\b/i.test(lower)) {
    return 'panjang';
  }
  if (/\b(manset|cuff)\b/i.test(lower)) {
    return 'manset';
  }
  if (/\b(tunik|hijab|gamis)\b/i.test(lower)) {
    return 'tunik';
  }
  if (/\b(tanpa\s*lengan|kutung|sleeveless|singlet)\b/i.test(lower)) {
    return 'tanpa_lengan';
  }
  return 'pendek';
}

/**
 * Helper to parse player role (pemain vs kiper/GK vs official) with whole word boundaries
 */
export function parseRoleType(text: string): JerseyRoleType {
  const lower = text.toLowerCase();
  if (/\b(kiper|gk|goal\s*keeper|goalkeeper|penjaga\s*gawang)\b/i.test(lower)) {
    return 'kiper';
  }
  if (/\b(official|ofisial|manager|manajer|pelatih|coach)\b/i.test(lower)) {
    return 'official';
  }
  if (/\b(anak|kids|junior)\b/i.test(lower)) {
    return 'anak';
  }
  return 'pemain';
}

/**
 * Main parser function to convert messy raw text into structured JerseyPlayerItem[]
 */
export function parseRawJerseyList(rawInput: string): JerseyPlayerItem[] {
  if (!rawInput || !rawInput.trim()) return [];

  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const players: JerseyPlayerItem[] = [];
  let currentGroupSize: string | null = null;
  let currentGroupSleeve: JerseySleeveType | null = null;
  let currentGroupRole: JerseyRoleType | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Ignore headers, decorative separators, or title lines
    if (
      rawLine.startsWith('===') ||
      rawLine.startsWith('---') ||
      rawLine.startsWith('___') ||
      rawLine.toLowerCase().startsWith('rekap') ||
      rawLine.toLowerCase().startsWith('daftar pesanan') ||
      rawLine.toLowerCase().startsWith('list jersey') ||
      rawLine.toLowerCase().startsWith('total:')
    ) {
      continue;
    }

    // Check if line is a Size Group Header (e.g. "Size L:" or "SIZE ANAK 7-8 TAHUN:" or "L = 5pcs:")
    const groupHeaderMatch = rawLine.match(/^(?:SIZE|UKURAN)?\s*(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|KIDS?\s*\d{1,2}(?:\s*[\-\/]\s*\d{1,2})?|ANAK\s*\d{1,2}(?:\s*[\-\/]\s*\d{1,2})?(?:\s*TAHUN)?)\s*(\([^\)]+\))?\s*[:=]\s*(.*)$/i);
    if (groupHeaderMatch) {
      const headerSize = normalizeJerseySize(groupHeaderMatch[1]);
      const headerMeta = groupHeaderMatch[2] || '';
      const inlineContent = (groupHeaderMatch[3] || '').trim();

      const headerSleeve = parseSleeveType(headerMeta);
      const headerRole = parseRoleType(headerMeta);

      currentGroupSize = headerSize;
      currentGroupSleeve = headerSleeve;
      currentGroupRole = headerRole;

      // If players listed on the same line after colon (e.g., "L : Budi (10), Doni (7)")
      if (inlineContent.length > 0) {
        const subItems = inlineContent.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0);
        for (const sub of subItems) {
          const parsed = parseSinglePlayerEntry(sub, headerSize, headerSleeve, headerRole);
          if (parsed) players.push(parsed);
        }
        continue;
      }
      continue;
    }

    // If line has comma-separated list of multiple players in current active group
    if (currentGroupSize && rawLine.includes(',') && !rawLine.includes('\t')) {
      const subItems = rawLine.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0);
      for (const sub of subItems) {
        const parsed = parseSinglePlayerEntry(sub, currentGroupSize, currentGroupSleeve || 'pendek', currentGroupRole || 'pemain');
        if (parsed) players.push(parsed);
      }
      continue;
    }

    // Normal line parsing
    const parsed = parseSinglePlayerEntry(rawLine, currentGroupSize, currentGroupSleeve, currentGroupRole);
    if (parsed) {
      players.push(parsed);
    }
  }

  return players;
}

/**
 * Parses an individual player string entry (e.g. "1.KENZIE 69 size S", "5.FARIS 14 size M", "14.AUREL 13 size anak 2 tahun")
 */
export function parseSinglePlayerEntry(
  rawText: string,
  inheritedSize: string | null = null,
  inheritedSleeve: JerseySleeveType | null = null,
  inheritedRole: JerseyRoleType | null = null
): JerseyPlayerItem | null {
  let text = rawText.trim();
  if (!text) return null;

  // 1. Remove leading list numbering (e.g. "1. ", "1.", "1) ", "1 - ", "• ", "- ", "[1] ")
  text = text.replace(/^\s*(?:\[\d+\]|\d+[\.\-\)\:\s])\s*/, '').trim();
  if (!text) return null;

  // 2. Handle Tab-Separated Data (Copy-Pasted from Excel / Google Sheets)
  if (text.includes('\t')) {
    const cols = text.split('\t').map((c) => c.trim()).filter((c) => c.length > 0);
    let name = 'PEMAIN';
    let number = '-';
    let size = inheritedSize || 'L';
    let notes = '';

    if (cols.length >= 3) {
      if (/^\d+$/.test(cols[0]) && cols.length >= 4) {
        name = cols[1] || 'PEMAIN';
        number = cols[2] || '-';
        size = normalizeJerseySize(cols[3]);
        if (cols[4]) notes = cols.slice(4).join(' ');
      } else {
        name = cols[0] || 'PEMAIN';
        number = cols[1] || '-';
        size = normalizeJerseySize(cols[2]);
        if (cols[3]) notes = cols.slice(3).join(' ');
      }

      return {
        id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name.toUpperCase(),
        number: number.toString(),
        size,
        sleeve: parseSleeveType(notes || text) !== 'pendek' ? parseSleeveType(notes || text) : inheritedSleeve || 'pendek',
        role: parseRoleType(notes || text) !== 'pemain' ? parseRoleType(notes || text) : inheritedRole || 'pemain',
        notes: notes || undefined,
        qty: 1,
      };
    }
  }

  // 3. Extract Role & Sleeve
  const detectedSleeve = parseSleeveType(text);
  const detectedRole = parseRoleType(text);
  const sleeve = detectedSleeve !== 'pendek' ? detectedSleeve : inheritedSleeve || 'pendek';
  const role = detectedRole !== 'pemain' ? detectedRole : inheritedRole || 'pemain';

  // Remove explicit role and sleeve words from text
  text = text
    .replace(/\b(kiper|gk|goal\s*keeper|goalkeeper|penjaga\s*gawang)\b/gi, ' ')
    .replace(/\b(official|ofisial|manager|manajer|pelatih|coach)\b/gi, ' ')
    .replace(/\b(lengan\s*panjang|tangan\s*panjang|long\s*sleeve|panjang|pjg)\b/gi, ' ')
    .replace(/\b(lengan\s*pendek|tangan\s*pendek|short\s*sleeve|pendek|pdk)\b/gi, ' ')
    .replace(/\b(tunik|hijab|gamis|manset|cuff|tanpa\s*lengan|kutung|sleeveless|singlet)\b/gi, ' ');

  let size = '';
  let number = '-';

  // 4. Extract Size with High Precision (Priority Ordered)

  // Pattern A: Kids / Anak Size with Range or Years
  // Matches: "size anak 7-8 tahun", "anak 7-8 th", "size anak 3-4 tahun", "size anak 2 tahun", "size 2 tahun anak", "size 8 anak"
  const kidsRangeMatch = text.match(/\b(?:size|ukuran|sz|uk)?\s*(?:anak|kids?|usia)\s*(\d{1,2}\s*[\-\/]\s*\d{1,2})\s*(?:tahun|thn|th|y|yo|bln|bulan)?\b/i);
  if (kidsRangeMatch) {
    size = normalizeJerseySize(kidsRangeMatch[0]);
    text = text.replace(kidsRangeMatch[0], ' ').trim();
  }

  if (!size) {
    const kidsYearMatch = text.match(/\b(?:size|ukuran|sz|uk)?\s*(?:anak|kids?|usia)\s*(\d{1,2})\s*(?:tahun|thn|th|y|yo|bln|bulan)?\b/i);
    if (kidsYearMatch) {
      size = normalizeJerseySize(kidsYearMatch[0]);
      text = text.replace(kidsYearMatch[0], ' ').trim();
    }
  }

  if (!size) {
    const yearOnlyMatch = text.match(/\b(?:size|ukuran|sz|uk)?\s*(\d{1,2})\s*(?:tahun|thn|th)\s*(?:anak|kids?)?\b/i);
    if (yearOnlyMatch) {
      size = normalizeJerseySize(yearOnlyMatch[0]);
      text = text.replace(yearOnlyMatch[0], ' ').trim();
    }
  }

  if (!size) {
    const kidsNumExplicit = text.match(/\b(?:size|ukuran|sz|uk)\s*(\d{1,2})\s*(?:anak|kids?)\b/i);
    if (kidsNumExplicit) {
      size = normalizeJerseySize(kidsNumExplicit[0]);
      text = text.replace(kidsNumExplicit[0], ' ').trim();
    }
  }

  // Pattern B: Explicit Adult Size with Prefix (e.g. "size S", "ukuran XL", "sz: XXL", "uk M")
  if (!size) {
    const adultExplicitMatch = text.match(/\b(?:size|ukuran|sz|uk|ukr|ukurn)\s*[:=\-]?\s*(XXXL|3XL|XXXXL|4XL|5XL|6XL|2XL|XXL|XL|XS|S|M|L|ALL\s*SIZE)\b/i);
    if (adultExplicitMatch) {
      size = normalizeJerseySize(adultExplicitMatch[1]);
      text = text.replace(adultExplicitMatch[0], ' ').trim();
    }
  }

  // Pattern C: Bracketed Adult Size (e.g. "(S)", "[M]", "(XL)", "(XXL)")
  if (!size) {
    const bracketSizeMatch = text.match(/[\(\[]\s*(XXXL|3XL|XXXXL|4XL|5XL|6XL|2XL|XXL|XL|XS|S|M|L|ALL\s*SIZE)\s*[\)\]]/i);
    if (bracketSizeMatch) {
      size = normalizeJerseySize(bracketSizeMatch[1]);
      text = text.replace(bracketSizeMatch[0], ' ').trim();
    }
  }

  // Pattern D: Standalone Adult Size (Multi-character first, then single character)
  if (!size) {
    const multiLetterMatch = text.match(/\b(XXXL|3XL|XXXXL|4XL|5XL|6XL|2XL|XXL|XL|XS|ALL\s*SIZE)\b/i);
    if (multiLetterMatch) {
      size = normalizeJerseySize(multiLetterMatch[1]);
      text = text.replace(multiLetterMatch[0], ' ').trim();
    }
  }

  // Standalone single-letter size (S, M, L) must be isolated between space/start/end
  if (!size) {
    const singleLetterMatch = text.match(/(?:^|\s)(S|M|L)(?=\s|$)/i);
    if (singleLetterMatch) {
      size = normalizeJerseySize(singleLetterMatch[1]);
      // Remove only the matched single letter token
      text = text.replace(new RegExp(`(?:^|\\s)${singleLetterMatch[1]}(?=\\s|$)`, 'i'), ' ').trim();
    }
  }

  if (!size) {
    size = inheritedSize || 'L';
  }

  // 5. Extract Jersey Number with Word Boundary (Prevents "RENO", "DINO", "BRUNO" from matching "NO")
  const numberExplicitMatch = text.match(/\b(?:NO\.?|NOMOR|NUM|#)\s*[:=\-]?\s*(\d{1,3})\b/i);
  if (numberExplicitMatch) {
    number = numberExplicitMatch[1];
    text = text.replace(numberExplicitMatch[0], ' ').trim();
  } else {
    // Check bracketed number "(10)" or "[07]"
    const bracketNumMatch = text.match(/[\(\[]\s*(\d{1,3})\s*[\)\]]/);
    if (bracketNumMatch) {
      number = bracketNumMatch[1];
      text = text.replace(bracketNumMatch[0], ' ').trim();
    }
  }

  // If number still not found, check lone 1-3 digit integer
  if (number === '-') {
    const loneNumMatch = text.match(/\b(\d{1,3})\b/);
    if (loneNumMatch) {
      number = loneNumMatch[1];
      text = text.replace(loneNumMatch[0], ' ').trim();
    }
  }

  // 6. Clean Name
  let cleanedName = text
    .replace(/\b(size|ukuran|sz|uk|tahun|thn|th|pcs|bh|buah|baju)\b/gi, ' ')
    .replace(/[\(\)\[\]\:\=\-\–\—\+\*\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const name = (cleanedName || (role === 'kiper' ? 'KIPER' : 'PEMAIN')).toUpperCase();

  return {
    id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    number,
    size: size || 'L',
    sleeve,
    role,
    qty: 1,
  };
}

/**
 * Groups players by standard size order and aggregates matrix statistics
 */
export function groupJerseyListBySize(players: JerseyPlayerItem[]): {
  groups: JerseySizeGroup[];
  summary: JerseyMatrixSummary;
} {
  const sizeMap = new Map<string, JerseyPlayerItem[]>();

  // Group items by normalized size
  for (const p of players) {
    const normSize = normalizeJerseySize(p.size);
    if (!sizeMap.has(normSize)) {
      sizeMap.set(normSize, []);
    }
    sizeMap.get(normSize)!.push(p);
  }

  // Sort groups by standard size hierarchy
  const sortedSizes = Array.from(sizeMap.keys()).sort((a, b) => {
    // Helper to get numeric sort score
    const getSortScore = (sz: string): number => {
      const idx = STANDARD_SIZE_ORDER.indexOf(sz);
      if (idx !== -1) return idx;

      // Kids range scoring (e.g. ANAK 7-8 TAHUN -> sort by start age)
      const kidsMatch = sz.match(/(\d{1,2})/);
      if (sz.includes('ANAK') || sz.includes('KIDS')) {
        const startAge = kidsMatch ? parseInt(kidsMatch[1], 10) : 0;
        return 1 + startAge; // Kids go before adult XS (score ~15)
      }

      return 100;
    };

    const scoreA = getSortScore(a);
    const scoreB = getSortScore(b);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.localeCompare(b);
  });

  const groups: JerseySizeGroup[] = [];
  const sizeCounts: Record<string, number> = {};

  let totalPlayers = 0;
  let totalPcs = 0;
  let pendekCount = 0;
  let panjangCount = 0;
  let otherSleeveCount = 0;
  let pemainCount = 0;
  let kiperCount = 0;
  let officialCount = 0;
  let otherRoleCount = 0;

  for (const sz of sortedSizes) {
    const list = sizeMap.get(sz) || [];
    let groupQty = 0;
    let grpPendek = 0;
    let grpPanjang = 0;
    let grpOther = 0;

    // Sort players within group by Number ascending
    list.sort((a, b) => {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.name.localeCompare(b.name);
    });

    for (const item of list) {
      const q = item.qty || 1;
      groupQty += q;
      totalPcs += q;
      totalPlayers += 1;

      if (item.sleeve === 'pendek') {
        grpPendek += q;
        pendekCount += q;
      } else if (item.sleeve === 'panjang') {
        grpPanjang += q;
        panjangCount += q;
      } else {
        grpOther += q;
        otherSleeveCount += q;
      }

      if (item.role === 'kiper') {
        kiperCount += q;
      } else if (item.role === 'official') {
        officialCount += q;
      } else if (item.role === 'anak') {
        otherRoleCount += q;
      } else {
        pemainCount += q;
      }
    }

    sizeCounts[sz] = groupQty;

    groups.push({
      size: sz,
      totalQty: groupQty,
      players: list,
      sleeveBreakdown: {
        pendek: grpPendek,
        panjang: grpPanjang,
        other: grpOther,
      },
    });
  }

  const summary: JerseyMatrixSummary = {
    totalPlayers,
    totalPcs,
    sizeCounts,
    sleeveCounts: {
      pendek: pendekCount,
      panjang: panjangCount,
      other: otherSleeveCount,
    },
    roleCounts: {
      pemain: pemainCount,
      kiper: kiperCount,
      official: officialCount,
      other: otherRoleCount,
    },
  };

  return { groups, summary };
}

/**
 * Formats grouped jersey list for WhatsApp message
 */
export function formatJerseyWhatsAppText(
  teamName: string,
  groups: JerseySizeGroup[],
  summary: JerseyMatrixSummary
): string {
  const title = teamName ? teamName.toUpperCase() : 'PESANAN JERSEY';
  let text = `*REKAP PESANAN JERSEY*\n`;
  text += `Tim / Artikel: ${title}\n`;
  text += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
  text += `----------------------------------------\n\n`;

  for (const grp of groups) {
    const sleeveInfo: string[] = [];
    if (grp.sleeveBreakdown.pendek > 0) sleeveInfo.push(`${grp.sleeveBreakdown.pendek} Pendek`);
    if (grp.sleeveBreakdown.panjang > 0) sleeveInfo.push(`${grp.sleeveBreakdown.panjang} Panjang`);
    if (grp.sleeveBreakdown.other > 0) sleeveInfo.push(`${grp.sleeveBreakdown.other} Lainnya`);

    text += `*SIZE ${grp.size}* (${grp.totalQty} Pcs - ${sleeveInfo.join(', ')})\n`;

    grp.players.forEach((p, idx) => {
      const numStr = p.number && p.number !== '-' ? `[#${p.number}]` : '';
      const sleeveStr = p.sleeve === 'panjang' ? ' (Panjang)' : p.sleeve !== 'pendek' ? ` (${p.sleeve})` : '';
      const roleStr = p.role === 'kiper' ? ' [GK/KIPER]' : p.role === 'official' ? ' [OFFICIAL]' : '';
      const notesStr = p.notes ? ` - ${p.notes}` : '';

      text += `  ${idx + 1}. *${p.name}* ${numStr}${sleeveStr}${roleStr}${notesStr}\n`;
    });
    text += `\n`;
  }

  text += `----------------------------------------\n`;
  text += `*REKAP MATRIKS UKURAN:*\n`;

  const sizeBreakdownStr = Object.entries(summary.sizeCounts)
    .map(([sz, count]) => `${sz}: *${count}*`)
    .join(' | ');

  text += `${sizeBreakdownStr}\n\n`;
  text += `Lengan: ${summary.sleeveCounts.pendek} Pendek | ${summary.sleeveCounts.panjang} Panjang\n`;
  if (summary.roleCounts.kiper > 0) {
    text += `Kiper: ${summary.roleCounts.kiper} Pcs | Pemain: ${summary.roleCounts.pemain} Pcs\n`;
  }
  text += `*TOTAL KESELURUHAN: ${summary.totalPcs} PCS*\n`;
  text += `----------------------------------------\n`;
  text += `_Mohon dicek kembali nama, nomor, dan ukurannya sebelum naik cetak. Terima kasih._`;

  return text;
}

/**
 * Generates CSV content formatted for Excel
 */
export function generateJerseyCsvContent(
  teamName: string,
  groups: JerseySizeGroup[],
  summary: JerseyMatrixSummary
): string {
  let csv = `REKAP PESANAN JERSEY - ${teamName.toUpperCase() || 'CETAKPRO'}\n`;
  csv += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;

  csv += `DAFTAR PEMAIN\n`;
  csv += `No,Ukuran (Size),Nama Punggung,Nomor,Lengan,Peran,Catatan\n`;

  let no = 1;
  for (const grp of groups) {
    for (const p of grp.players) {
      csv += `${no++},"${grp.size}","${p.name}","${p.number}","${p.sleeve}","${p.role}","${p.notes || '-'}"\n`;
    }
  }

  csv += `\nREKAP MATRIKS UKURAN\n`;
  csv += `Ukuran (Size),Jumlah (Pcs)\n`;
  for (const [sz, count] of Object.entries(summary.sizeCounts)) {
    csv += `"${sz}",${count}\n`;
  }
  csv += `"TOTAL",${summary.totalPcs}\n`;

  return csv;
}
