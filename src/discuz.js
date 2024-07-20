import MySQL from 'mysql2';
import yabbcode from 'ya-bbcode';
import { fillNumber } from './utils/index.js';

let isDbConnected = false;
const bbcode = new yabbcode();
const conn = MySQL.createConnection({
  host:     process.env.DB_ADDRESS || '127.0.0.1',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


bbcode.registerTag('color', {
  type: 'replace',
  open: (attr) => `<span style="color:${attr}">`,
  close: '</span>',
});

bbcode.registerTag('s', {
  type: 'replace',
  open: '<s>',
  close: '</s>',
});

conn.connect((err) => {
  if (err) {
    console.error('Failed to connect to Discuz! database');
    console.error(err);
    return;
  }

  isDbConnected = true;
});


const getAvatarPath = (uid) => {
  const _uid = fillNumber(uid, 9);
  return `${_uid.substring(0, 3)}/${_uid.substring(3, 5)}/${_uid.substring(5, 7)}/${_uid.substring(7, 9)}`;
};


const waitForConnecting = () => new Promise((res) => {
  if (isDbConnected) return res(true);

  const clockId = setInterval(() => {
    if (!isDbConnected) return;
    res(true);
    clearInterval(clockId);
  }, 500);
});

const doDbQuery = (query) => new Promise(async (res, rej) => {
  await waitForConnecting();

  conn.query(query, (err, result) => {
    if (err) return rej(err);
    res(result);
  });
});

export const getAllUsers = () => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}common_member\``)
    .then((e) => {
      const result = [ ...e ];
      for (let i = 0; i < result.length; i++) {
        if (result[i].avatarstatus !== 1) result[i].avatarpath = 'noavatar.svg';
        else result[i].avatarpath = `${getAvatarPath(result[i].uid)}_avatar_big.jpg`;
      }
      res(result);
    })
    .catch((e) => rej(e));
});

export const getUser = (uid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}common_member\` WHERE \`uid\`=${uid}`)
    .then((e) => {
      if (e.length <= 0) return rej('No such user');
      
      const result = e[0];
      if (result.avatarstatus !== 1) result.avatarpath = 'noavatar.svg';
      else result.avatarpath = `${getAvatarPath(uid)}_avatar_big.jpg`;
      res(result);
    })
    .catch(e => rej(e));
});

export const getFieldClasses = (fid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_threadclass\` WHERE \`fid\`=${fid}`)
    .then(e => {
      const result = [ ...e ].sort((a, b) => a.displayorder - b.displayorder);
      for (let i = 0; i < result.length; i++) {
        result[i].name = bbcode.parse(result[i].name);
      }
      res(result);
    })
    .catch(e => rej(e))
});

export const getClass = (typeid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_threadclass\` WHERE \`typeid\`=${typeid}`)
    .then(e => {
      const result = e[0];
      result.name = bbcode.parse(result.name);
      res(result);
    })
  .catch(e => rej(e));
});

const _getAllFields = () => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_forum\` WHERE \`status\`=1`)
    .then(e => {
      const result = [];

      for (const group of e) {
        if (group.type !== 'group' || group.fup !== 0) continue;
        result.push({
          fid: group.fid,
          name: group.name,
          displayorder: group.displayorder,
          subfields: e.filter(i => i.fup === group.fid && i.type === 'forum').sort((a, b) => a.displayorder - b.displayorder),
        });
      }
      
      result.sort((a, b) => a.displayorder - b.displayorder);
      res(result);
    })
    .catch(e => rej(e));
});

const _getField = (fid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_forumfield\` WHERE \`fid\`=${fid}`)
    .then(e => {
      if (e.length <= 0) return rej('No such field');
      res(e[0]);
    })
    .catch(e => rej(e));
});

const _parseFields = (_fields) => new Promise(async (res) => {
  const fields = [ ..._fields ];
  for (const field of fields) {
    const info = await _getField(field.fid);

    field.description = info.description;
    field.icon = info.icon;
    field.rules = info.rules;

    if (field.subfields) field.subfields = await _parseFields(field.subfields);
  }

  res(fields);
});

export const getAllFields = () => new Promise(async (res) => {
  const Fields = await _getAllFields();
  const result = await _parseFields(Fields);
  res(result);
});

export const getAllThreads = () => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_thread\``)
    .then(e => res(e))
    .catch(e => rej(e));
});

export const getFieldThreads = (fid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_thread\` WHERE \`fid\`=${fid}`)
    .then(e => res(e))
    .catch(e => rej(e));
});

export const getUserThreads = (uid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_thread\` WHERE \`authorid\`=${uid}`)
    .then(e => res(e))
    .catch(e => rej(e));
});

export const getThread = (tid) => new Promise((res, rej) => {
  doDbQuery(`SELECT * from \`${process.env.DB_PREFIX}forum_post\` WHERE \`tid\`=${tid}`)
    .then(e => {
      const result = e.filter(e => e.first === 1)[0];
      const subThreads = e.filter(e => e.first !== 1).sort((a, b) => a.position - b.position);
      
      result.message = bbcode.parse(result.message);
      result.subthreads = subThreads;

      result.subthreads = result.subthreads.map((e) => {
        const result = { ...e };
        result.message = bbcode.parse(result.message);
        return result;
      });

      res(result);
    })
    .catch(e => rej(e))
});

export const disconnect = () => new Promise((res, rej) => {
  conn.end((err) => {
    if (err) return rej(err);
    isDbConnected = false;
    res(true);
  });
});

