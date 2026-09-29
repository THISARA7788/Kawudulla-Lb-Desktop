const ExcelJS = require('exceljs');
const path = require('path');

async function generateMemberTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kawudulla Central College Library';
  workbook.lastModifiedBy = 'Library System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Members Template', {
    views: [{ showGridLines: true }]
  });

  // Exactly 6 Columns matching hh.xlsx
  worksheet.columns = [
    { header: 'Full Name', key: 'name', width: 26 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Role (student/teacher)', key: 'role', width: 24 },
    { header: 'Grade (e.g. Grade 10, Grade 12)', key: 'grade', width: 30 },
    { header: 'Class Section / A/L Stream', key: 'class', width: 28 },
    { header: 'Password (Optional - Default: Kmv@1234)', key: 'password', width: 38 },
  ];

  // Header Row Styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9E0D0D' } // School Brand Maroon
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF7F0A0A' } },
      left: { style: 'thin', color: { argb: 'FF7F0A0A' } },
      bottom: { style: 'medium', color: { argb: 'FF4C0000' } },
      right: { style: 'thin', color: { argb: 'FF7F0A0A' } }
    };
  });

  // Notice row spanning all 6 columns A-F
  const noteRow = worksheet.addRow([
    '📌 NOTE: If the Password column is left blank, the system automatically assigns the default password "Kmv@1234". Students and teachers can log in and change their password anytime from their profile settings.'
  ]);
  noteRow.height = 28;
  worksheet.mergeCells(`A${noteRow.number}:F${noteRow.number}`);
  const noteCell = worksheet.getCell(`A${noteRow.number}`);
  noteCell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FF1E293B' } };
  noteCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' } // Amber notice background
  };
  noteCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  noteCell.border = {
    top: { style: 'thin', color: { argb: 'FFF59E0B' } },
    left: { style: 'thin', color: { argb: 'FFF59E0B' } },
    bottom: { style: 'thin', color: { argb: 'FFF59E0B' } },
    right: { style: 'thin', color: { argb: 'FFF59E0B' } }
  };

  const outputPath = path.resolve(__dirname, '../../client/public/library_member_import_template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Clean template matching hh.xlsx saved at: ${outputPath}`);
}

generateMemberTemplate().catch(console.error);
