#!/usr/bin/env bash
set -eu -o pipefail

BASEDIR="$(cd "$(dirname $0)/../" ; pwd)"

$BASEDIR/../../../scripts/frontend/install_node_modules $BASEDIR
