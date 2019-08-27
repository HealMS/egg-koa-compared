const Koa = require('koa');
const nunjucks = require('nunjucks');
const app = new Koa();

//const env = nunjucks.configure('view', {
//  autoescape: true,
//  noCache: false
//});

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('view', { noCache: false }));

app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.query.size != null) {
        ctx.body = await env.render(`${ctx.query.size}.nj`);
    }
});

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx);
    ctx.status = 429;
    ctx.body = "too many request";
});

app.listen(7001);
