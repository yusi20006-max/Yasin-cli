#!/usr/bin/env node
'use strict';

/**
 * Canonical Node launcher for Yasin CLI.
 * yasin.sh remains a shell compatibility wrapper that invokes the same entrypoint.
 *
 * NOTE: src/index.js only self-bootstraps when it is the main module, so the
 * package bin must invoke bootstrap() explicitly; otherwise `yasin` exits
 * silently without dispatching any command.
 */
require('../src/index.js').bootstrap();
