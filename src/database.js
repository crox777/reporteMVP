import sqlite3 from 'sqlite3';

const db = new sqlite3.Database(':memory:');

export async function initDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source TEXT NOT NULL,
          title TEXT NOT NULL,
          url TEXT UNIQUE NOT NULL,
          file_path TEXT,
          processed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          report_id INTEGER,
          summary TEXT,
          kpis TEXT,
          full_analysis TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(report_id) REFERENCES reports(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export async function isReportProcessed(url) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM reports WHERE url = ?', [url], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
}

export async function saveReport(report) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO reports (source, title, url, file_path) VALUES (?, ?, ?, ?)',
      [report.source, report.title, report.url, report.filePath],
      function(err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID });
      }
    );
  });
}

export async function saveAnalysis(reportId, analysis) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO analyses (report_id, summary, kpis, full_analysis) VALUES (?, ?, ?, ?)',
      [reportId, analysis.summary, JSON.stringify(analysis.kpis), analysis.fullAnalysis],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}