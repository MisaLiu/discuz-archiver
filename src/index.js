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


if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

Discuz.getAllFields()
  .then(e => View.parseFile('home.tmpl', path.resolve(DIST_DIR, './index.html'), { fields: e }));


