// Custom Harvard-Kyoto (HK) to Devanagari and IAST Transliterator

const VOWELS: Record<string, { devanagari: string; sign: string; iast: string }> = {
  'a': { devanagari: 'अ', sign: '', iast: 'a' },
  'A': { devanagari: 'आ', sign: 'ा', iast: 'ā' },
  'i': { devanagari: 'इ', sign: 'ि', iast: 'i' },
  'I': { devanagari: 'ई', sign: 'ी', iast: 'ī' },
  'u': { devanagari: 'उ', sign: 'ु', iast: 'u' },
  'U': { devanagari: 'ऊ', sign: 'ू', iast: 'ū' },
  'R': { devanagari: 'ऋ', sign: 'ृ', iast: 'ṛ' },
  'e': { devanagari: 'ए', sign: 'े', iast: 'e' },
  'ai': { devanagari: 'ऐ', sign: 'ै', iast: 'ai' },
  'o': { devanagari: 'ओ', sign: 'ो', iast: 'o' },
  'au': { devanagari: 'औ', sign: 'ौ', iast: 'au' }
};

const CONSONANTS: Record<string, { devanagari: string; iast: string }> = {
  'k': { devanagari: 'क', iast: 'k' },
  'kh': { devanagari: 'ख', iast: 'kh' },
  'g': { devanagari: 'ग', iast: 'g' },
  'gh': { devanagari: 'घ', iast: 'gh' },
  'G': { devanagari: 'ङ', iast: 'ṅ' },
  'c': { devanagari: 'च', iast: 'c' },
  'ch': { devanagari: 'छ', iast: 'ch' },
  'j': { devanagari: 'ज', iast: 'j' },
  'jh': { devanagari: 'झ', iast: 'jh' },
  'J': { devanagari: 'ञ', iast: 'ñ' },
  'T': { devanagari: 'ट', iast: 'ṭ' },
  'Th': { devanagari: 'ठ', iast: 'ṭh' },
  'D': { devanagari: 'ड', iast: 'ḍ' },
  'Dh': { devanagari: 'ढ', iast: 'ḍh' },
  'N': { devanagari: 'ण', iast: 'ṇ' },
  't': { devanagari: 'त', iast: 't' },
  'th': { devanagari: 'थ', iast: 'th' },
  'd': { devanagari: 'द', iast: 'd' },
  'dh': { devanagari: 'ध', iast: 'dh' },
  'n': { devanagari: 'न', iast: 'n' },
  'p': { devanagari: 'प', iast: 'p' },
  'ph': { devanagari: 'फ', iast: 'ph' },
  'b': { devanagari: 'ब', iast: 'b' },
  'bh': { devanagari: 'भ', iast: 'bh' },
  'm': { devanagari: 'म', iast: 'm' },
  'y': { devanagari: 'य', iast: 'y' },
  'r': { devanagari: 'र', iast: 'r' },
  'l': { devanagari: 'ल', iast: 'l' },
  'v': { devanagari: 'व', iast: 'v' },
  'z': { devanagari: 'श', iast: 'ś' },
  'S': { devanagari: 'ष', iast: 'ṣ' },
  'sh': { devanagari: 'श', iast: 'ś' },
  'Sh': { devanagari: 'ष', iast: 'ṣ' },
  's': { devanagari: 'स', iast: 's' },
  'h': { devanagari: 'ह', iast: 'h' }
};

const SPECIALS: Record<string, { devanagari: string; iast: string }> = {
  'M': { devanagari: 'ं', iast: 'ṃ' },
  'H': { devanagari: 'ः', iast: 'ḥ' },
  '\'': { devanagari: 'ऽ', iast: '\'' } // avagraha
};

// Returns tokens from HK string
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  
  const multiChar = ['ai', 'au', 'kh', 'gh', 'ch', 'jh', 'Th', 'Dh', 'th', 'dh', 'ph', 'bh', 'Sh', 'sh'];

  while (i < text.length) {
    let found = false;
    for (const m of multiChar) {
      if (text.startsWith(m, i)) {
        tokens.push(m);
        i += m.length;
        found = true;
        break;
      }
    }
    if (!found) {
      tokens.push(text[i]);
      i++;
    }
  }
  return tokens;
}

export function hkToDevanagari(text: string): string {
  if (!text) return '';
  const tokens = tokenize(text);
  let devanagari = '';
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (CONSONANTS[token]) {
      const devCons = CONSONANTS[token].devanagari;
      const nextToken = tokens[i + 1];

      if (nextToken && VOWELS[nextToken]) {
        // Consonant followed by a vowel
        const vInfo = VOWELS[nextToken];
        devanagari += devCons + vInfo.sign;
        i += 2; // Skip consonant and vowel
      } else {
        // Consonant not followed by a vowel: add virama (halanta)
        devanagari += devCons + '्';
        i++;
      }
    } else if (VOWELS[token]) {
      // Standalone or starting vowel: use independent form
      devanagari += VOWELS[token].devanagari;
      i++;
    } else if (SPECIALS[token]) {
      devanagari += SPECIALS[token].devanagari;
      i++;
    } else {
      // Non-Sanskrit character (spaces, punctuation, etc.)
      devanagari += token;
      i++;
    }
  }

  // Polish virama cases, e.g., dual virama or virama followed by spaces/punctuation
  return devanagari;
}

export function hkToIast(text: string): string {
  if (!text) return '';
  const tokens = tokenize(text);
  let iast = '';

  for (const token of tokens) {
    if (VOWELS[token]) {
      iast += VOWELS[token].iast;
    } else if (CONSONANTS[token]) {
      iast += CONSONANTS[token].iast;
    } else if (SPECIALS[token]) {
      iast += SPECIALS[token].iast;
    } else {
      iast += token;
    }
  }

  return iast;
}
