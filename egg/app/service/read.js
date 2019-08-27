const Service = require('egg').Service;

class ReadService extends Service {
    async render(env, size) {
        try {
            return await env.render(`${size}.nj`);
        } catch (err) {
            this.ctx.throw(500);
        }
    }
}

module.exports = ReadService;