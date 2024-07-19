import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as ejs from 'ejs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootdir = path.resolve(__dirname, '../');

const VIEW_DIR = path.resolve(__rootdir, './views');


const parseView = (filename, data = {}, extraOptions = {}) => new Promise((res, rej) => {
  const options = {
    root: VIEW_DIR,
    views: [ VIEW_DIR ],
    ...extraOptions,
  };

  ejs.renderFile(`views/${filename}`, data, options, (err, result) => {
    if (err) return rej(err);
    res(result);
  });
});

