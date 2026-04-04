module.exports = {
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(),
      write: jest.fn(() => Promise.resolve('mock-path')),
    })),
  },
  PDFPage: {
    create: jest.fn(() => ({
      setMediaBox: jest.fn(),
      addText: jest.fn(),
    })),
  },
};
