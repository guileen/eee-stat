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
		// texts.push(node.textContent)
		texts.push(node.innerHTML)
	}
	return texts
}

async function download(url, file) {
	let texts = await getBody(url)
	await mkdirp(dirname(file))
	fs.writeFileSync(file, JSON.stringify(texts, '', 2))
}

async function wb() {
	for(let i=1;i<=64;i++) {
		console.log('downloading wb', i)
		await download('https://www.eee-learning.com/book/wangbe'+fix2Num(i), '王弼注/'+i+'.json')
	}
}

async function kyd() {
	for(let i =1;i<=64;i++) {
		console.log('downloading 周易正义', i)
		await download('https://www.eee-learning.com/book/eee-jy'+i, '周易正义[孔颖达疏]/'+i+'.json')
	}
}

async function yz() {
	for(let i =1;i<=64;i++) {
		console.log('downloading 易传', i)
		await download('https://www.eee-learning.com/book/eee'+i, '易传/'+i+'.json')
	}
}

async function zx() {
	for(let i =23;i<=64;i++) {
		console.log('downloading 朱熹', i)
		await download('https://www.eee-learning.com/book/juicy'+fix2Num(i), '周易本义[朱熹]/'+i+'.json')
	}
}

async function ycz() {
	for(let i =1;i<=64;i++) {
		console.log('downloading 程頤', i)
		await download('https://www.eee-learning.com/book/yi-chen-chan'+i, '易程传[程颐]/'+i+'.json')
	}
}

async function zyjj() {
	for(let i =1;i<=64;i++) {
		console.log('downloading 周易集解', i)
		await download('https://www.eee-learning.com/book/sunshinyan/'+i, '周易集解/'+i+'.json')
	}
}

async function main() {
	await Promise.all([
		/*
		yz(),
		wb(),
		kyd(),
		zyjj(),
		ycz(),
		*/
		zx(),
	])
}

main()
