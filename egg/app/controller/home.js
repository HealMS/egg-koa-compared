const Controller = require('egg').Controller;

class HomeController extends Controller {
    async index() {
        const {size} = this.ctx.query;
        // ctx.body = await this.ctx.service.read.readFile();
        this.ctx.body = await this.ctx.renderView(`${size}.nj`);
    }
}
/** 这里需要export */
module.exports = HomeController;