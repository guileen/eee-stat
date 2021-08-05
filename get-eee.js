const fetch = require('node-fetch')
const fs = require('fs')
const {JSDOM} = require('jsdom')
const mkdirp = require('mkdirp')
const {dirname} = require('path')

function fix2Num(i) {
	return i<10?('0'+i):(''+i)
}

async function getBody(url) {
	const res = await fetch(url)
	const text = await res.text()
	const dom = new JSDOM(text)
	const doc = dom.window.document;
	const list = doc.querySelectorAll(".content .field-name-body p")
	const texts = []
	for(let node of list) {
		texts.push(node.textContent)
	}
	return texts
}

async function download(url, file) {
	let texts = await getBody(url)
	await mkdirp(dirname(file))
	fs.writeFileSync(file, JSON.stringify(texts, '', 2))
}

async function main() {
	for(let i =1;i<=64;i++) {
		console.log('downloading', i)
		await Promise.all([
			download('https://www.eee-learning.com/book/eee'+i, 'eee/'+i+'.json'),
			download('https://www.eee-learning.com/book/wangbe'+fix2Num(i), 'wb/'+i+'.json'),
		])
		console.log('downloaded', i)
	}
}

main()
