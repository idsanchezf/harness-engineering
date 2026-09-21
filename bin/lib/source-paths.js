'use strict';

const path = require('node:path');

// Unica fuente de verdad para la ubicacion de la raiz del paquete y de las carpetas
// fuente (agents/, skills/), agnosticas de cualquier CLI. Antes cada provider en
// providers/*.js calculaba su propio PACKAGE_ROOT por separado (mismo `../../../`
// duplicado en varios archivos, riesgo de que diverjan si se mueve un archivo).
const PACKAGE_ROOT = path.join(__dirname, '..', '..');
const AGENTS_DIR = path.join(PACKAGE_ROOT, 'agents');
const SKILLS_DIR = path.join(PACKAGE_ROOT, 'skills');

module.exports = { PACKAGE_ROOT, AGENTS_DIR, SKILLS_DIR };
