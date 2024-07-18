import MySQL from 'mysql2';

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

