const fs = require('fs');
const path = require('path');

const textTpl = [
  '```bash',
  'anyproxy --rule {{url}}',
  '```',
  '```js',
  '{{content}}',
  '```'
].join('\n');

/**
 *
 * @param {*} config
 * @param {string} config.input input markdown path
 * @param {string} config.ouput output markdown path
 */
function mergeMdWithRuleFile(config) {
  const doc = fs.readFileSync(config.input, { encoding: 'utf8' });
  const rules = doc.match(/\{\{sample-rule:([\S]+)\}\}/g).map((rawToReplace) => ({
    raw: rawToReplace,
    url: rawToReplace.replace(/\{\{sample-rule:([\S]+)\}\}/g, ($0, $1) => {
      return $1;
    })
  }));

  const tasks = rules.map((item) => (
    new Promise((resolve, reject) => {
      fs.readFile(item.url, 'utf8', (err, data) => {
        if (!err) {
          const result = Object.assign({}, item);
          result.content = data;
          resolve(result);
        } else {
          reject(err);
        }
      });
    })
  ));

  // fetch all samples
  return Promise.all(tasks)
    .then((results) => {
      // merge to doc
      let resultDoc = doc;
      results.forEach((item) => {
        const contentToInsert = textTpl.replace('{{url}}', item.url).replace('{{content}}', item.content);
        resultDoc = resultDoc.replace(item.raw, contentToInsert);
      });
      fs.writeFileSync(config.output, resultDoc);
    }, (fail) => {
      console.log('failed to load resource');
      console.log(fail);
      process.exit();
    })
    .catch(e => {
      console.log(e);
      process.exit();
    });
}

Promise.all([
  {
    input: path.join(__dirname, '../docs-src/cn/src_doc.md'),
    output: path.join(__dirname, '../docs-src/cn/README.md'),
  },
  {
    input: path.join(__dirname, '../docs-src/en/src_doc.md'),
    output: path.join(__dirname, '../docs-src/en/README.md'),
  }
].map(mergeMdWithRuleFile)).then(result => {
  console.log('done');
}).catch(e => {
  console.log('err');
  console.log(e);
});
