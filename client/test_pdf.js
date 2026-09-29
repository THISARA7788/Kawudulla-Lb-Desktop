const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const run = () => {
  try {
    const doc = new jsPDF();
    
    // Load font file as base64
    const fontPath = path.join(__dirname, 'public/fonts/NotoSansSinhala-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      console.error('Font file not found at:', fontPath);
      return;
    }
    const fontBuffer = fs.readFileSync(fontPath);
    const base64 = fontBuffer.toString('base64');
    
    doc.addFileToVFS('NotoSansSinhala-Regular.ttf', base64);
    doc.addFont('NotoSansSinhala-Regular.ttf', 'NotoSansSinhala', 'normal');
    doc.setFont('NotoSansSinhala', 'normal');
    doc.setFontSize(16);

    // Test cases
    const tests = [
      { label: 'Original: ගම්පෙරළිය', text: 'ගම්පෙරළිය' },
      { label: 'Swapped: ගම්ෙපරළිය', text: 'ගම්ෙපරළිය' },
      { label: 'Original: අප්පච්චි', text: 'අප්පච්චි' },
      { label: 'Original: කුලී නිවසේ අබිරහස', text: 'කුලී නිවසේ අබිරහස' },
      { label: 'Decomposed: කුලී නිවෙස්‌ අබිරහස', text: 'කුලී නිවෙස්‌ අබිරහස' }
    ];

    let y = 20;
    tests.forEach(t => {
      doc.text(t.label, 14, y);
      y += 10;
      doc.text(`Rendered: ${t.text}`, 14, y);
      y += 15;
    });

    const outPath = path.join(__dirname, 'test_render.pdf');
    const pdfData = doc.output();
    fs.writeFileSync(outPath, pdfData, 'binary');
    console.log('PDF saved to:', outPath);
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
