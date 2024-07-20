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

// Generate /f/*/*.html
for (const field of Fields) {
  for (const sub of field.subfields) {
    const FIELD_DIST_DIR = path.resolve(DIST_DIR, `./f/${sub.fid}`);

    if (!fs.existsSync(FIELD_DIST_DIR)) {
      fs.mkdirSync(FIELD_DIST_DIR);
    }

    const Threads = (await Discuz.getFieldThreads(sub.fid)).sort((a, b) => b.lastpost - a.lastpost);
    const Classes = await Discuz.getFieldClasses(sub.fid);
    const PageCount = Math.ceil(Threads.length / process.env.SITE_ITEM_PER_PAGE);

    if (PageCount <= 0) continue;

    await View.parseFile('field.tmpl', path.resolve(FIELD_DIST_DIR, './index.html'), {
      field: sub,
      threads: Threads.slice(0, process.env.SITE_ITEM_PER_PAGE),
      classes: Classes,
      page: {
        baseHref: `/f/${sub.fid}`,
        current: 1,
        total: PageCount,
      },
    });

    if (PageCount === 1) continue;

    for (let i = 1; i < PageCount; i++) {
      await View.parseFile('field.tmpl', path.resolve(FIELD_DIST_DIR, `./${i + 1}.html`), {
        field: sub,
        threads: Threads.slice(process.env.SITE_ITEM_PER_PAGE * i, process.env.SITE_ITEM_PER_PAGE * (i + 1)),
        classes: Classes,
        page: {
          baseHref: `/f/${sub.fid}`,
          current: i + 1,
          total: PageCount,
        },
      });
    }
  }
}

// Disconnect database
await Discuz.disconnect();

