#!/usr/bin/env node
import { analyze } from './lib.js';

const targetPath = process.argv[2] || '.';
const output = analyze(targetPath);
console.log(output);