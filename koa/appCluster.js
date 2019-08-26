const Koa = require('koa');
const nunjucks = require('nunjucks');
const numCpus = require('os').cpus().length;
const cluster = require('cluster');
const app = new Koa();

nunjucks.configure('view', {
    autoescape: true,
    noCache: false
});

if (cluster.isMaster) {
    for (let i=0; i<numCpus; i++) {
        cluster.fork();
    }
} else {
    app.use(async (ctx, next) => {
        if (ctx.method === 'GET') {
            // ctx.type = "text/plain";
            // ctx.body = data.toString();
            ctx.body = nunjucks.render(`${ctx.query.size}.nj`);
        }
    });
    
    app.on('error', (err, ctx) => {
        // console.error('server error', err, ctx);
        ctx.status = 429;
        ctx.body = "too many request";
    });
    
    app.listen(7001);
}