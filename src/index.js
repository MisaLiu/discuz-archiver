import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as fs from 'node:fs';
import * as Discuz from './discuz.js';
import * as View from './view.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootdir = path.resolve(__dirname, '../');

const DIST_DIR = path.resolve(__rootdir, './dist');
const DISCUZ_DATA_DIR = path.resolve(__rootdir, './data');


(async () => {

// Create dist dir if not exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

// Generate index.html
const Fields = await Discuz.getAllFields();
await View.parseFile('home.tmpl', path.resolve(DIST_DIR, './index.html'), { fields: Fields })

// Create field dist dir if not exist
if (!fs.existsSync(path.resolve(DIST_DIR, './f'))) {
  fs.mkdirSync(path.resolve(DIST_DIR, './f'));
}

// Generate /f/*.html
for (const field of Fields) {
  for (const sub of field.subfields) {
    const Threads = await Discuz.getFieldThreads(sub.fid);
    const Classes = await Discuz.getFieldClasses(sub.fid);
    await View.parseFile('field.tmpl', path.resolve(DIST_DIR, `./f/${sub.fid}.html`), { field: sub, threads: Threads, classes: Classes });
  }
}

// Disconnect database
await Discuz.disconnect();

})();

