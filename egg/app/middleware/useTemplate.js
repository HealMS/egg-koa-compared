const path = require('path');
const nunjucks = require('nunjucks');

exports.useTemplate = () => {
    const viewPath = path.resolve(__dirname, '../view');
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(viewPath, { noCache: false }));
    return env;
};