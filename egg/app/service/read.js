const Service = require('egg').Service;
const fs = require('fs');
const util = require('util');
const { resolve } = require('path');
const readFile = util.promisify(fs.readFile);

class ReadService extends Service {
    async readFile() {
        const ctx = this.ctx;
        const {size} = ctx.query;
        let data = '';
        try {
            data = await readFile(resolve(__dirname, '../../../views', `${size}KB.js`));
        } catch (err) {
            console.error(err);
        }
        return data.toString();
    }
}

module.exports = ReadService;