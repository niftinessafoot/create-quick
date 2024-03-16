import {
  access,
  constants,
  copyFileSync,
  mkdir,
  readdirSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..');
const root = resolve();

// Generate package.json
const devDependencies = {
  gulp: '^4',
  'gulp-babel': '^8',
  'gulp-include': '^2',
  'gulp-sass': '^5',
  'gulp-uglify': '^3',
  sass: '^1',
};

const packageObj = {
  name: basename(root),
  description: '',
  version: '0.0.0',
  scripts: {
    start: 'gulp',
    build: 'gulp build',
  },
  type: 'module',
  keywords: [],
  author: '',
  license: 'MIT',
  ...{ devDependencies },
};

const reportFileExists = ({ code, dest, path }) => {
  const isExisting = code === 'EEXIST';

  if (isExisting) {
    console.warn(`${dest ?? path} already exists.`);
  }

  return isExisting;
};

const generateSourceDirectories = () => {
  const source = 'src';
  const sourceDirs = ['i', 'inc', 'scripts', 'styles'];

  sourceDirs.forEach((dir) => {
    const path = resolve(root, source, dir);

    access(path, (err) => {
      if (err) {
        mkdir(path, { recursive: true }, (err) => {
          if (err) {
            console.log(err);
          }
          console.log('Generating directory:', path);
        });
      }
    });
  });
};

const writePackageJson = () => {
  let count = 0;
  const dest = resolve(root, 'package.json');

  const formattedString = JSON.stringify(packageObj).replace(
    /(\{|\}|:|,)/g,
    (match) => {
      const tab = '\t';
      const nl = '\r\n';

      switch (match) {
        case '{':
          return `{${nl}${tab.repeat(++count)}`;
          break;
        case '}':
          return `${nl}${tab.repeat(--count)}}`;
          break;
        case ':':
          return `: `;
          break;
        default:
          return `,${nl}${tab.repeat(count)}`;
      }
    }
  );

  try {
    writeFileSync(dest, formattedString, { flag: 'w' });
  } catch (err) {
    if (!reportFileExists(err)) {
      console.error(err);
    }
  }
};

const copyFiles = () => {
  const filesDir = resolve(packageRoot, `files`);
  const files = readdirSync(filesDir);

  Array.isArray(files) &&
    files.forEach((file) => {
      const source = resolve(filesDir, file);
      const dest = resolve(root, file);

      try {
        copyFileSync(source, dest, constants.COPYFILE_EXCL);
      } catch (err) {
        if (!reportFileExists(err)) {
          console.error(err);
        }
      }
    });
};

const init = () => {
  if (root === packageRoot) {
    throw new Error('Do not run initializer on itself.');
  }

  generateSourceDirectories();
  copyFiles();
  writePackageJson();
};

export default init;
