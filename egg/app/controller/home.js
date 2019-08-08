const Controller = require('egg').Controller;

class HomeController extends Controller {
    async index() {
        const ctx = this.ctx;
        ctx.body = await this.ctx.service.read.readFile();
    }
}
/** 这里需要export */
module.exports = HomeController;