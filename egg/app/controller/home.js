const Controller = require('egg').Controller;
const template = require('../middleware/useTemplate.js');
const env = template.useTemplate();
class HomeController extends Controller {
    async index() {
        const {size} = this.ctx.query;
        this.ctx.body = await this.ctx.service.read.render(env, size);
    }
}
/** 这里需要export */
module.exports = HomeController;