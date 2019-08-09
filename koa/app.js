const Koa = require('koa');
const fs = require('fs');
const { resolve } = require('path');
const { promisify } = require('util');
const app = new Koa();
const readFile = promisify(fs.readFile);

app.use(async (ctx, next) => {
    if (ctx.method === 'GET') {
        let data = await readFile(resolve(__dirname, "../views", `${ctx.query.size}KB.js`));
        ctx.type = "text/plain";
        ctx.body = data.toString();
    }
});

app.on('error', (err, ctx) => {
    // console.error('server error', err, ctx);
    ctx.status = 429;
    ctx.body = "too many request";
});

app.listen(7001);