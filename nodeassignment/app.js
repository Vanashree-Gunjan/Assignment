const express = require('express');
const multer = require('multer');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;

const app = express();
const port = 3000;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});

const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));
app.post('/upload', upload.single('pdfFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  res.status(200).send('File uploaded successfully.');
});
app.post('/extract-pages', async (req, res) => {
  try {
    const originalFileName = req.body.originalFileName;  
    const selectedPages = req.body.selectedPages;  
    const pdfBuffer = await fs.readFile(path.join(__dirname, 'uploads', originalFileName));
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const newPdfDoc = await PDFDocument.create();
    for (const pageNumber of selectedPages) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
      newPdfDoc.addPage(copiedPage);
    }
    const newPdfBytes = await newPdfDoc.save();
    const newFileName = 'newPDF.pdf';
    await fs.writeFile(path.join(__dirname, 'uploads', newFileName), newPdfBytes);

    res.status(200).send('New PDF created successfully.');
  } catch (error) {
    res.status(500).send('Error creating new PDF: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
