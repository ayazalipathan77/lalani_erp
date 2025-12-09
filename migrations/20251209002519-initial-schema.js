import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
export function setup(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

export async function up(db) {
  var filePath = path.join(__dirname, 'sqls', '20251209002519-initial-schema-up.sql');
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  })
    .then(function (data) {
      return db.runSql(data);
    });
};

export async function down(db) {
  // For initial migration, down migration would drop all tables
  // This is dangerous in production, so we'll leave it empty for safety
  return null;
};

export const _meta = {
  "version": 1
};
