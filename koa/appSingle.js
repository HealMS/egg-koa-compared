const Koa = require('koa');
const nunjucks = require('nunjucks');
const app = new Koa();

nunjucks.configure('view', {
  autoescape: true,
  noCache: false
});

app.use(async (ctx, next) => {
    if (ctx.method === 'GET') {
        // let data = await readFile(resolve(__dirname, "../views", `${ctx.query.size}KB.js`));
        // ctx.body = data.toString();
        ctx.body = await nunjucks.render(`${ctx.query.size}.nj`);
    }
});

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx);
    ctx.status = 429;
    ctx.body = "too many request";
});

app.listen(7001);
