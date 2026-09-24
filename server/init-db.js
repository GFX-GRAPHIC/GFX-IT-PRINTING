import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  console.log('--- Inisialisasi Database MySQL CetakPro POS ---');
  
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT || '3306');
  const dbName = process.env.DB_NAME || 'cetakpro_pos';

  try {
    // 1. Connect without database first
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true,
    });

    console.log(`✓ Terhubung ke server MySQL (${host}:${port})`);

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // 3. Execute schema
    await connection.query(sql);
    console.log(`✓ Database '${dbName}' dan seluruh tabel berhasil dibuat/diperbarui.`);

    await connection.end();
    return true;
  } catch (err) {
    console.warn(`! Perhatian koneksi MySQL: ${err.message}`);
    console.warn('  Aplikasi akan berjalan dalam mode Hybrid / Local Fallback jika MySQL server belum dijalankan.');
    return false;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase();
}

export { initDatabase };
