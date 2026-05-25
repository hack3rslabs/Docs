export function numberToWords(num: number): string {
  if (num === 0) return 'zero';
  
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    return '';
  }

  let words = '';
  // Crore
  if (num >= 10000000) {
    words += inWords(Math.floor(num / 10000000)) + 'crore ';
    num %= 10000000;
  }
  // Lakh
  if (num >= 100000) {
    words += inWords(Math.floor(num / 100000)) + 'lakh ';
    num %= 100000;
  }
  // Thousand
  if (num >= 1000) {
    words += inWords(Math.floor(num / 1000)) + 'thousand ';
    num %= 1000;
  }
  // Remaining
  words += inWords(num);

  return words.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
