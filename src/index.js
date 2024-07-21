import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as fs from 'node:fs';
import * as Discuz from './discuz.js';
import * as View from './view.js';
import { parse as parseBBCode, BBCode } from './bbcode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootdir = path.resolve(__dirname, '../');

const DIST_DIR = path.resolve(__rootdir, './dist');
const DISCUZ_DATA_DIR = path.resolve(__rootdir, './data');

const DeletedThreadFilter = (e) => {
  if (e.displayorder < 0 && e.status >=544) return false;
  return true;
};


// Create dist dir if not exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

// Generate index.html
const Fields = await Discuz.getAllFields();
await View.parseFile('home.tmpl', path.resolve(DIST_DIR, './index.html'), { title: '首页', fields: Fields });

// Create field dist dir if not exist
if (!fs.existsSync(path.resolve(DIST_DIR, './f'))) {
  fs.mkdirSync(path.resolve(DIST_DIR, './f'));
}

// Get users info
const Users = await Discuz.getAllUsers();
(await Discuz.getAllUsersBio()).forEach((bio) => {
  const user = Users.find((e) => e.uid === bio.uid);
  user.bio = bio;
});

// Generate /f/*/*.html
for (const field of Fields) {
  for (const sub of field.subfields) {
    const FIELD_DIST_DIR = path.resolve(DIST_DIR, `./f/${sub.fid}`);

    if (!fs.existsSync(FIELD_DIST_DIR)) {
      fs.mkdirSync(FIELD_DIST_DIR);
    }

    const Threads = (await Discuz.getFieldThreads(sub.fid)).filter(DeletedThreadFilter).sort((a, b) => b.lastpost - a.lastpost);
    const Classes = await Discuz.getFieldClasses(sub.fid);
    const PageCount = Math.ceil(Threads.length / process.env.SITE_ITEM_PER_PAGE);

    for (let i = 0; i < PageCount; i++) {
      const fileName = i === 0 ? './index.html' : `./${i + 1}.html`;
      await View.parseFile('field.tmpl', path.resolve(FIELD_DIST_DIR, fileName), {
        title: `${sub.name} - 第${i + 1}页`,
        field: sub,
        threads: Threads.slice(process.env.SITE_ITEM_PER_PAGE * i, process.env.SITE_ITEM_PER_PAGE * (i + 1)),
        classes: Classes,
        page: {
          baseHref: `f/${sub.fid}`,
          current: i + 1,
          total: PageCount,
        },
      });
    }
  }
}

// Create thread dist dir if not exist
if (!fs.existsSync(path.resolve(DIST_DIR, './t'))) {
  fs.mkdirSync(path.resolve(DIST_DIR, './t'));
}

const FieldsAll = [];
Fields.forEach((field) => {
  FieldsAll.push(...field.subfields);
});

// Generate /t/*/*.html
const Threads = (await Discuz.getAllThreads()).filter(DeletedThreadFilter);
for (const thread of Threads) {
  const THREAD_DIST_DIR = path.resolve(DIST_DIR, `./t/${thread.tid}`);
  
  if (!fs.existsSync(THREAD_DIST_DIR)) {
    fs.mkdirSync(THREAD_DIST_DIR);
  }
  
  const field = FieldsAll.find((e) => e.fid === thread.fid);
  if (!field) continue;

  const detail = await Discuz.getThread(thread.tid);
  const classInfo = thread.typeid > 0 ? (await Discuz.getClass(thread.typeid)) : null;
  const threadsList = [ detail, ...detail.subthreads ].sort((a, b) => a.position - b.position);
  const PageCount = Math.ceil((detail.subthreads.length + 1) / process.env.SITE_ITEM_PER_PAGE);

  for (const thread of threadsList) {
    // Parse user data to threads
    thread.authorinfo = Users.find((e) => e.uid === thread.authorid);

    // Parse BBCode
    thread.messageparsed = parseBBCode(thread.message);
    thread.message = BBCode.htmlEncode(thread.message);
  }

  for (let i = 0; i < PageCount; i++) {
    const fileName = i === 0 ? './index.html' : `./${i + 1}.html`;
    await View.parseFile('thread.tmpl', path.resolve(THREAD_DIST_DIR, fileName), {
      title: `${classInfo ? `[${classInfo.name}] ` : ''}${thread.subject} - 第${i + 1}页${field ? ` - ${field.name}` : ''}`,
      field: field,
      classInfo: classInfo,
      threadInfo: thread,
      threads: threadsList.slice(process.env.SITE_ITEM_PER_PAGE * i, process.env.SITE_ITEM_PER_PAGE * (i + 1)),
      page: {
        baseHref: `t/${detail.tid}`,
        current: i + 1,
        total: PageCount,
      },
    });
  }
}

// Create user dist dir if not exist
if (!fs.existsSync(path.resolve(DIST_DIR, './u'))) {
  fs.mkdirSync(path.resolve(DIST_DIR, './u'));
}

// Generate /u/*/*.html
for (const user of Users) {
  const USER_DIST_DIR = path.resolve(DIST_DIR, `./u/${user.uid}`);

  if (!fs.existsSync(USER_DIST_DIR)) {
    fs.mkdirSync(USER_DIST_DIR);
  }

  const threads = Threads.filter((e) => e.authorid === user.uid).sort((a, b) => b.dateline - a.dateline);
  const PageCount = Math.ceil(threads.length / process.env.SITE_ITEM_PER_PAGE);

  if (threads.length <= 0) continue;

  for (let i = 0; i < PageCount; i++) {
    const fileName = i === 0 ? './index.html' : `./${i + 1}.html`;
    await View.parseFile('user.tmpl', path.resolve(USER_DIST_DIR, fileName), {
      title: user.username,
      user: user,
      threads: threads.slice(process.env.SITE_ITEM_PER_PAGE * i, process.env.SITE_ITEM_PER_PAGE * (i + 1)),
      page: {
        baseHref: `u/${user.uid}`,
        current: i + 1,
        total: PageCount,
      },
    });
  }
}

// Disconnect database
await Discuz.disconnect();

