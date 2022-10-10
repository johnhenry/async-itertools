[↑](../readme.md)

# Installation and Usage

- [Installation and Usage](#installation-and-usage)
  - [Installation](#installation)
  - [Usage](#usage)
    - [IFFE ('script src=')](#iffe-script-src)
    - [Common JS ('require')](#common-js-require)
    - [Ecmascript modules ('import')](#ecmascript-modules-import)

## Installation

```bash
npm install async-itertools
```

## Usage

AsyncItertools is built in three different module flavors:

### IFFE ('script src=')

The traditional way to load javascript in browsers.

```html
<html>
  <script src="./node_modules/async-itertools/dist/asyncItertools.mjs"></script>
  <script>
    // do stuff with asyncItertools
  </script>
</html>
```

### Common JS ('require')

The traditional way to load javascript in node.

```javascript
const asyncItertools = require("./node_modules/async-itertools/dist/cjs/index.cjs");
// do stuff with asyncItertools
```

### Ecmascript modules ('import')

The modern way to load javascript in browsers and node.

```html
<html>
  <script type="module">
    import * as asyncItertools from "./node_modules/async-itertools/dist/index.mjs";
    // do stuff with asyncItertools
  </script>
</html>
```

```javascript
// import * as asyncItertools from './node_modules/async-itertools/dist/index.mjs';
import * as asyncItertools from "async-itertools";
// do stuff with asyncItertools
```
