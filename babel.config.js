if (process.env.NODE_ENV === 'test') {
  module.exports = {};
} else {
  module.exports = {
    presets: [
      'es2015',
      'stage-0'
    ]
  };
}

