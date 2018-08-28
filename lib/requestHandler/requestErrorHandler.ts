'use strict';

/*
* handle all request error here,
*
*/
import * as pug from 'pug';
import * as path from 'path';

const error502PugFn = pug.compileFile(path.join(__dirname, '../resource/502.pug'));
const certPugFn = pug.compileFile(path.join(__dirname, '../resource/cert_error.pug'));

/**
* get error content for certification issues
*/
function getCertErrorContent(error: NodeJS.ErrnoException, fullUrl: string): string {
  let content;
  const title = 'The connection is not private. ';
  let explain = 'There are error with the certfication of the site.';
  switch (error.code) {
    case 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY': {
      explain = 'The certfication of the site you are visiting is not issued by a known agency, '
        + 'It usually happenes when the cert is a self-signed one.</br>'
        + 'If you know and trust the site, you can run AnyProxy with option'
        + ' <strong>-ignore-unauthorized-ssl</strong> to continue.'

      break;
    }
    default: {
      explain = '';
      break;
    }
  }

  try {
    content = certPugFn({
      title,
      explain,
      code: error.code,
    });
  } catch (parseErro) {
    content = error.stack;
  }

  return content;
}

/*
* get the default error content
*/
function getDefaultErrorCotent(error: NodeJS.ErrnoException, fullUrl: string): string {
  let content;

  try {
    content = error502PugFn({
      error,
      url: fullUrl,
      errorStack: error.stack.split(/\n/),
    });
  } catch (parseErro) {
    content = error.stack;
  }

  return content;
}

/*
* get mapped error content for each error
*/
export default class RequestErrorHandler {
  public getErrorContent: (error: NodeJS.ErrnoException, fullUrl: string) => string =
    function(error: NodeJS.ErrnoException, fullUrl: string): string {
      let content = '';
      error = error || { name: 'default_by_anyproxy', message: 'this is the default error'};
      switch (error.code) {
        case 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY': {
          content = getCertErrorContent(error, fullUrl);
          break;
        }
        default: {
          content = getDefaultErrorCotent(error, fullUrl);
          break;
        }
      }

      return content;
    };
}
