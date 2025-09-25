import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function generatePDF() {
  try {
    // Read the HTML template
    const htmlContent = fs.readFileSync(path.join(__dirname, 'report-template.html'), 'utf8');

    // Launch puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content
    await page.setContent(htmlContent);

    // Generate PDF
    await page.pdf({
      path: path.join(__dirname, 'water-savings-report-2024.pdf'),
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true
    });

    await browser.close();
    console.log('PDF generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF(); 