import {
  access,
  constants,
  copyFileSync,
  mkdir,
  readFileSync,
  readdirSync,
} from 'fs';
import { EOL } from 'os';
import { execSync } from 'child_process';
import writeJson from '@afoot/write-json';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..');
const root = resolve();

// Generate package.json
const devDependencies = [
  'gulp@^4',
  'gulp-babel@^8',
  'gulp-include@^2',
  'gulp-sass@^5',
  'gulp-uglify@^3',
  'sass@^1',
];

const overrides = {
  scripts: {
    start: 'gulp',
    build: 'gulp build',
  },
  type: 'module',
};

/**
 * Generates default package.json and outputs the parsed JSON.
 * @returns {Object} Contents of package.json
 */
const initNpm = () => {
  execSync('npm init -y');
  const str = readFileSync(resolve('package.json'), 'utf8');
  const obj = JSON.parse(str);

  return obj;
};

/**
 * Extends base package.json and rewrites the file.
 */
const writePackageJson = () => {
  const baseJson = initNpm();

  console.log('Writing package.json', EOL);

  Object.assign(baseJson, overrides);
  writeJson('package.json', baseJson);
};

/**
 * Create default subdirectories in src file.
 */
const generateSourceDirectories = () => {
  const source = 'src';
  const sourceDirs = ['i', 'inc', 'scripts', 'styles'];
  const rootIndex = root.length;

  console.log('Generating directories', EOL);

  sourceDirs.forEach((dir) => {
    const path = resolve(root, source, dir);

    access(path, (err) => {
      if (err) {
        mkdir(path, { recursive: true }, (err) => {
          if (err) {
            console.log(err);
          }

          const report = `.${path.substring(rootIndex)}`;
          console.log('Generated directory:', report);
        });
      }
    });
  });
};

/**
 * Pulls contents of `files` from package and copies into target directory.
 * Fails if the file already exists.
 */
const copyFiles = () => {
  console.log('Copying files', EOL);
  const filesDir = resolve(packageRoot, `files`);
  const files = readdirSync(filesDir);

  Array.isArray(files) &&
    files.forEach((file) => {
      const source = resolve(filesDir, file);
      const dest = resolve(root, file);

      try {
        copyFileSync(source, dest, constants.COPYFILE_EXCL);
      } catch (err) {
        const { code } = err;

        switch (code) {
          case 'EEXIST':
            console.warn(`${dest} already exists.`);
            break;
          default:
            console.error(err);
        }
      }
    });
};

/**
 *
 * @param {(Array | string)} dependencies Dependencies to install.
 * @param {string} flags Args passed to `npm install. e.g.: --save-dev`
 */
const npmInstall = (dependencies = [], flags = '') => {
  console.log('Installing dependencies.', EOL);

  const list = Array.isArray(dependencies)
    ? dependencies.join(' ')
    : dependencies;

  execSync(`npm i ${list} ${flags}`, { stdio: 'inherit' });
  console.log('');
};

const init = () => {
  if (root === packageRoot) {
    throw new Error('Do not run initializer on itself.');
  }

  writePackageJson();
  generateSourceDirectories();
  copyFiles();
  npmInstall(devDependencies, '-D');
};

export default init;
