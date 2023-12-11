const express = require('express');
const app = express();
const http = require('http');
const fetch = require('node-fetch');

app.use(express.json())
app.use(express.text())
app.use(express.form())

app.use(async (req, res) => {

  let outBody, outStatus = 200, outStatusText = 'OK', outCt = null;
  
  try {
    let url = req.url;
    url = decodeURIComponent(url.substr(url.indexOf('/') + 1));

    if (req.method == "OPTIONS" || url.length < 3 || url.indexOf('.') == -1 || url == "favicon.ico" || url == "robots.txt") {
      
      outBody = JSON.stringify({
          code: 0,
          usage: 'Host/{URL}',
          source: 'https://github.com/netnr/workers'
      });
      outCt = "application/json";
    }
    else if (blocker.check(url)) {
      outBody = JSON.stringify({
          code: 415,
          msg: 'The keyword: ' + blocker.keys.join(' , ') + ' was blocklisted by the operator of this proxy.'
      });
      outCt = "application/json";
    }
    else {
      url = fixUrl(url);

      let fp = {
          method: req.method,
          headers: req.headers
      }

      if (["POST", "PUT", "PATCH", "DELETE"].indexOf(request.method) >= 0) {
        fp.body = req.body
      }

      let fr = (await fetch(url, fp));
      outCt = fr.headers.get('content-type');
      outStatus = fr.status;
      outStatusText = fr.statusText;
      outBody = fr.body;

    }
  } catch (err) {
    outBody = JSON.stringify({
      code: -1,
      msg: JSON.stringify(err.stack) || err
    });
  }
  
  if (outCt) {
    res.setHeader('content-type', outCt);
  };
  
  res.status(outStatus).send(outBody); 

});

function fixUrl(url) {
  if (url.startsWith("://")) {
      return `https${url}`;
  } else if (url.startsWith(':')) {
    return url.replace(':', 'https://');
  } else {
    return `https://${url}`;
  }
};

const blocker = {
  keys: [".ts", ".acc", ".m4s", "photocall.tv", "googlevideo.com", "liveradio.ie"],
  check: function (url) {
      url = url.toLowerCase();
      let len = blocker.keys.filter(x => url.includes(x)).length;
      return len != 0;
  }
};

app.listen(process.env.PORT || 3000)
