/**
 * Generates all possible Sri Lankan hyphenation patterns for a given clean ISBN string.
 * Sri Lankan ISBNs always start with country code '955' (ISBN-10) or prefix + country code '978-955-' / '978-624-' (ISBN-13).
 */
function getSriLankanISBNHyphenations(isbn) {
  const clean = isbn.replace(/[-\s]/g, '');
  const hyphenations = [];

  // ISBN-13
  if (clean.length === 13 && (clean.startsWith('978955') || clean.startsWith('978624'))) {
    const prefix = clean.slice(0, 3);
    const group = clean.slice(3, 6);
    const rest = clean.slice(6, 12);
    const check = clean.slice(12);
    // Publisher Prefix can be 2 to 5 digits
    for (let pubLen = 2; pubLen <= 5; pubLen++) {
      const pub = rest.slice(0, pubLen);
      const item = rest.slice(pubLen);
      hyphenations.push(`${prefix}-${group}-${pub}-${item}-${check}`);
    }
  } 
  // ISBN-10
  else if (clean.length === 10 && clean.startsWith('955')) {
    const group = clean.slice(0, 3);
    const rest = clean.slice(3, 9);
    const check = clean.slice(9);
    // Publisher Prefix can be 2 to 5 digits
    for (let pubLen = 2; pubLen <= 5; pubLen++) {
      const pub = rest.slice(0, pubLen);
      const item = rest.slice(pubLen);
      hyphenations.push(`${group}-${pub}-${item}-${check}`);
    }
  }

  return hyphenations;
}

/**
 * Parses search results HTML from isbn.lk
 */
function parseIsbnLkHTML(html) {
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  
  while ((match = trRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds = [];
    let tdMatch;
    
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const cellText = tdMatch[1].replace(/<[^>]*>/g, '').trim();
      tds.push(cellText);
    }
    
    if (tds.length >= 5) {
      const publisher = tds[0];
      const title = tds[1];
      const author = tds[2];
      const isbn = tds[3];
      const issueDate = tds[4];

      // Ignore header row or blank rows
      if (!title || !author || title.toLowerCase().includes('title of the book')) {
        continue;
      }

      rows.push({
        publisher: publisher || '',
        title: title || '',
        author: author || '',
        isbn: isbn || '',
        publishedYear: issueDate ? issueDate.split('-')[0] : ''
      });
    }
  }
  return rows;
}

/**
 * Searches isbn.lk for the given ISBN by trying all hyphenation patterns in parallel.
 */
async function lookupSriLankanISBN(isbn) {
  const hyphenations = getSriLankanISBNHyphenations(isbn);
  if (hyphenations.length === 0) {
    // If not a Sri Lankan ISBN pattern, return null
    return null;
  }

  // Query all hyphenation patterns at the same time to speed up lookup
  const fetchPromises = hyphenations.map(async (hyp) => {
    try {
      const bodyParams = new URLSearchParams({
        publishername: '',
        booktitle: '',
        authorsname: '',
        ccode: '',
        prefixnumber: hyp,
        fromdate: '',
        todate: '',
        submit: 'Search'
      });

      const response = await fetch('https://isbn.lk/index.php/Welcome/searchResults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(6000) // 6 seconds timeout per request
      });

      if (!response.ok) return null;

      const html = await response.text();
      if (html.includes('Total Number of Results : 0')) {
        return null;
      }

      const results = parseIsbnLkHTML(html);
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      console.warn(`Parallel check failed for pattern ${hyp}:`, err.message);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  
  // Return the first valid match we found
  return results.find(res => res !== null) || null;
}

module.exports = {
  lookupSriLankanISBN
};
