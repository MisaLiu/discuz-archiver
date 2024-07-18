import MySQL from 'mysql2';
import { fillNumber } from './index.js';

let isDbConnected = false;
const conn = MySQL.createConnection({
  host:     process.env.DB_ADDRESS || '127.0.0.1',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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

export const getAllUids = () => new Promise((res, rej) => {
  doDbQuery(`SELECT \`uid\` from \`${process.env.DB_PREFIX}ucenter_members\``)
    .then((result) => res(result.map((e) => {
      return e.uid;
    })))
    .catch((e) => rej(e));
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

export const getAllTids = () => new Promise((res, rej) => {
  doDbQuery(`SELECT \`tid\` from \`${process.env.DB_PREFIX}forum_thread\``)
    .then(result => res(result.map((e) => {
      return e.tid;
    })))
    .catch(e => rej(e));
});

