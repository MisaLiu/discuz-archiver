import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as ejs from 'ejs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootdir = path.resolve(__dirname, '../');

const VIEW_DIR = path.resolve(__rootdir, './views');


const parseView = (filename, data = {}, extraOptions = {}) => new Promise((res, rej) => {
  const innerData = {
    site: {
      baseUrl: process.env.SITE_BASE || '/',
    },
    ...data,
  };

  const options = {
    root: VIEW_DIR,
    views: [ VIEW_DIR ],
    ...extraOptions,
  };

  ejs.renderFile(`views/${filename}`, innerData, options, (err, result) => {
    if (err) return rej(err);
    res(result);
  });
});

const parseViewFile = (filename, outputFilename, data = {}, extraOptions = {}) => new Promise(async (res, rej) => {
  const result = await parseView(filename, data, extraOptions);
  fs.writeFile(outputFilename, result, { encoding: 'utf8' })
    .then(e => res(e))
    .catch(e => rej(e));
});

