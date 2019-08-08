'use strict'

const autocannon = require('autocannon')
const reporter = require('autocannon-reporter')
const path = require('path')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function makeAutocannon(param) {
    autocannon(param).on('done', handleResults)
}

function handleResults(result) {
    console.log(result);
    // const reportOutputPath = path.join(`./result/${result.title}_report.html`)
    // reporter.writeReport(reporter.buildReport(result), reportOutputPath, (err, res) => {
    //     if (err) console.error('Error writting report: ', err)
    //     else console.log('Report written to: ', reportOutputPath)
    // })
}

// 请求参数
const autocannonParam = {
    url: 'http://127.0.0.1:7001',
    connections: 100,
    duration: 5,
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
    for (let i = 0; i < autocannonList.length; i++) {
        if (i !== 0) {
            await sleep((autocannonList[i - 1].duration) * 1000)
            makeAutocannon(autocannonList[i])
        } else {
            makeAutocannon(autocannonList[i])
        }
    }
}
// 启动
run(['10', '50', '100']);