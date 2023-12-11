const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", req.header('Access-Control-Allow-Headers') || "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token");
    next();
});

app.all('*', async (req, res) => {
    try {
        let url = decodeURIComponent(req.path.substr(1));

        if (req.method == "OPTIONS" || url.length < 3 || url.indexOf('.') == -1 || url == "favicon.ico" || url == "robots.txt") {
            res.json({
                code: 0,
                usage: 'Host/{URL}',
                source: 'https://github.com/netnr/workers'
            });
        } else {
            url = fixUrl(url);


            let fp = {
                method: req.method,
                headers: {...req.headers}
            }

            delete fp.headers['host'];
            delete fp.headers['content-length'];

            if (["POST", "PUT", "PATCH", "DELETE"].indexOf(req.method) >= 0) {
                const ct = (req.header('content-type') || "").toLowerCase();
                if (ct.includes('application/json')) {
                    fp.body = JSON.stringify(req.body);
                } else if (ct.includes('application/text') || ct.includes('text/html')) {
                    fp.body = req.text();
                } else if (ct.includes('form')) {
                    fp.body = req.formData();
                } else {
                    fp.body = req.blob();
                }
            }

            let fr = await fetch(url, fp);
            res.status(fr.status);
            res.set('Content-Type', fr.headers.get('Content-Type'));
            res.send(await fr.buffer());
        }
    } catch (err) {
        res.json({
            code: -1,
            msg: JSON.stringify(err.stack) || err
        });
    }
});

function fixUrl(url) {
    if (url.includes("://")) {
        return url;
    } else if (url.includes(':/')) {
        return url.replace(':/', '://');
    } else {
        return "https://" + url;
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
