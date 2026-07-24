// Custom Harvard-Kyoto (HK) / Google Transliteration to Devanagari and IAST Transliterator

const VOWELS: Record<string, { devanagari: string; sign: string; iast: string }> = {
  'a': { devanagari: 'अ', sign: '', iast: 'a' },
  'aa': { devanagari: 'आ', sign: 'ा', iast: 'ā' },
  'A': { devanagari: 'आ', sign: 'ा', iast: 'ā' },
  'i': { devanagari: 'इ', sign: 'ि', iast: 'i' },
  'ii': { devanagari: 'ई', sign: 'ी', iast: 'ī' },
  'ee': { devanagari: 'ई', sign: 'ी', iast: 'ī' },
  'I': { devanagari: 'ई', sign: 'ी', iast: 'ī' },
  'u': { devanagari: 'उ', sign: 'ु', iast: 'u' },
  'uu': { devanagari: 'ऊ', sign: 'ू', iast: 'ū' },
  'oo': { devanagari: 'ऊ', sign: 'ू', iast: 'ū' },
  'U': { devanagari: 'ऊ', sign: 'ू', iast: 'ū' },
  'ri': { devanagari: 'ऋ', sign: 'ृ', iast: 'ṛ' },
  'R': { devanagari: 'ऋ', sign: 'ृ', iast: 'ṛ' },
  'rr': { devanagari: 'ॠ', sign: 'ॄ', iast: 'ṝ' },
  'RR': { devanagari: 'ॠ', sign: 'ॄ', iast: 'ṝ' },
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
  'ng': { devanagari: 'ङ', iast: 'ṅ' },
  'G': { devanagari: 'ङ', iast: 'ṅ' },
  'c': { devanagari: 'च', iast: 'c' },
  'ch': { devanagari: 'च', iast: 'c' }, // Google Transliteration phonetic
  'chh': { devanagari: 'छ', iast: 'ch' }, // Google Transliteration phonetic
  'j': { devanagari: 'ज', iast: 'j' },
  'jh': { devanagari: 'झ', iast: 'jh' },
  'ny': { devanagari: 'ञ', iast: 'ñ' }, // Google Transliteration phonetic
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
  'f': { devanagari: 'फ', iast: 'ph' }, // phonetic mapping
  'b': { devanagari: 'ब', iast: 'b' },
  'bh': { devanagari: 'भ', iast: 'bh' },
  'm': { devanagari: 'म', iast: 'm' },
  'y': { devanagari: 'य', iast: 'y' },
  'r': { devanagari: 'र', iast: 'r' },
  'l': { devanagari: 'ल', iast: 'l' },
  'v': { devanagari: 'व', iast: 'v' },
  'w': { devanagari: 'व', iast: 'v' }, // phonetic mapping
  'z': { devanagari: 'श', iast: 'ś' },
  'S': { devanagari: 'ष', iast: 'ṣ' },
  'sh': { devanagari: 'श', iast: 'ś' },
  'shh': { devanagari: 'ष', iast: 'ṣ' }, // phonetic mapping
  'Sh': { devanagari: 'ष', iast: 'ṣ' },
  's': { devanagari: 'स', iast: 's' },
  'h': { devanagari: 'ह', iast: 'h' },
  
  // Conjuncts
  'gy': { devanagari: 'ज्ञ', iast: 'jñ' },
  'ksh': { devanagari: 'क्ष', iast: 'kṣ' },
  'tr': { devanagari: 'त्र', iast: 'tr' },
  'shr': { devanagari: 'श्र', iast: 'śr' }
};

const SPECIALS: Record<string, { devanagari: string; iast: string }> = {
  'M': { devanagari: 'ं', iast: 'ṃ' },
  'H': { devanagari: 'ः', iast: 'ḥ' },
  '\'': { devanagari: 'ऽ', iast: '\'' }, // avagraha
  'OM': { devanagari: 'ॐ', iast: 'oṃ' },
  '|': { devanagari: '।', iast: '|' },
  '||': { devanagari: '॥', iast: '||' },
  '.': { devanagari: '।', iast: '.' },
  '..': { devanagari: '॥', iast: '..' }
};

const multiChar = Object.keys({ ...VOWELS, ...CONSONANTS, ...SPECIALS })
  .filter(k => k.length > 1)
  .sort((a, b) => b.length - a.length);

// Returns tokens from HK string
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  
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

export function iastToHk(iast: string): string {
  if (!iast) return '';
  
  const mapping: Record<string, string> = {
    'ā': 'A', 'Ā': 'A',
    'ī': 'I', 'Ī': 'I',
    'ū': 'U', 'Ū': 'U',
    'ṛ': 'ri', 'Ṛ': 'ri',
    'ṝ': 'rr', 'Ṝ': 'rr',
    'ṅ': 'ng', 'Ṅ': 'ng',
    'ñ': 'ny', 'Ñ': 'ny',
    'ṭ': 'T', 'Ṭ': 'T',
    'ṭh': 'Th', 'ṬH': 'Th',
    'ḍ': 'D', 'Ḍ': 'D',
    'ḍh': 'Dh', 'ḌH': 'Dh',
    'ṇ': 'N', 'Ṇ': 'N',
    'ś': 'sh', 'Ś': 'sh',
    'ṣ': 'shh', 'Ṣ': 'shh',
    'ṃ': 'M',
    'ḥ': 'H',
    '’': '\''
  };

  let hk = '';
  let i = 0;
  while (i < iast.length) {
    const char = iast[i];
    if (mapping[char] !== undefined) {
      hk += mapping[char];
    } else {
      hk += char;
    }
    i++;
  }
  return hk;
}
