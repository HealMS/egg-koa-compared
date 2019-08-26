'use strict'

const autocannon = require('autocannon')
// const reporter = require('autocannon-reporter')
const fs = require('fs');
const util = require('util');
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const batch_size = 30;
const initConcurrent = Number(process.env.initConcurrent);
const step = Number(process.env.step);
const duration = 5;
const framework = process.env.framework;
const pro = process.env.process;
let final_result;
let invalidDataCount;


function makeAutocannon(param, fn) {
    return new Promise((resolve, reject) => {
        autocannon(param).on('done', resolve)
    }).then(fn);
}

async function oneBatchDone() {
    for(let key in final_result) {
        if (['connections', 'title'].indexOf(key) === -1) {
            final_result[key] = (final_result[key]/(batch_size-invalidDataCount)).toFixed(2) || 0;
        }
    }
    final_result.success = (final_result.total - final_result.errors) / final_result.total;
    const reportOutputPath = path.resolve(__dirname, './result/template', `${framework}-${pro}-${final_result.title}.json`);
    if (final_result.success < 0.1) {  //已达极限
        return false;
    }
    try {
        if (!fs.existsSync(reportOutputPath)) {
            await writeFile(reportOutputPath, `[\n\t${JSON.stringify(final_result)}`);
        } else {
            await appendFile(reportOutputPath, `,\n\t${JSON.stringify(final_result)}`);
        }
        console.log('Report written to: ', reportOutputPath);
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}

function handleResults(result) {
    console.log(result);
    if (!result.requests.total && result.errors) {
        invalidDataCount++;
        return;
    }
    const { latency: {average, min, max}, errors, throughput: {average: _throughput}, '2xx': total, connections, title } = result;
    const partOfResult = {average, min, max, errors, throughput: _throughput, '2xx': total, total:total+errors, connections, title};
    console.log(partOfResult);
    if (final_result == null) {
        final_result = partOfResult;
    } else {
        for(let [key, val] of Object.entries(final_result)) {
            if (['connections', 'title'].indexOf(key) === -1) {
                final_result[key] = val + partOfResult[key];
            }
        }
    }
}

// 请求参数
const autocannonParam = {
    url: 'http://127.0.0.1:7001',
    connections: initConcurrent,
    duration,
    headers: {
        type: 'text/plain'
    }
}
// 请求报文参数
const requestsParam = {
    method: 'GET', // this should be a put for modifying secret details
    headers: { // let submit some json?
        'Content-type': 'application/json; charset=utf-8'
    }
}

async function run(sizeList) {
    const autocannonList = sizeList.map(size => {
        return {
            ...autocannonParam,
            url: autocannonParam.url + `?size=${size}`,
            title: size,
            requests: [
                {
                    ...requestsParam,
                }
            ],
        }
    })
    for (let i=0; i<autocannonList.length; i++) {  //批量处理不同size
        for (;;) {  //并发数递增
            console.log("current concurrents, file-size: ", autocannonList[i].connections, autocannonList[i].title);
            final_result = null;
            invalidDataCount = 0;
            for (let j=0; j<batch_size; j++) {  //多次取平均值
                try {
		    if (j !== 0) {
                        await sleep(3000);
                        await makeAutocannon(autocannonList[i], handleResults)
                    } else {
                        await makeAutocannon(autocannonList[i], handleResults)
                    }
		} catch (err) {
		    console.error(err);
		    return;
		}
            }
            const mostError = await oneBatchDone();
            if (!mostError) break;
            // if (autocannonList[i].connections < 13000) {
            //     autocannonList[i].connections += 1000;
            // } else {
            //     autocannonList[i].connections += 100;
            // }
            autocannonList[i].connections += step;
        }
        await writeFile(resolve(__dirname, './result/template', `${framework}-${pro}-${autocannonList[i].title}.json`), '\n]');  //json数组闭合
    }
}
// 启动
run(['50', '100']);
