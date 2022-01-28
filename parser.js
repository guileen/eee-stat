const fs = require('fs');

const fuhao = '䷀,䷁,䷂,䷃,䷄,䷅,䷆,䷇,䷈,䷉,䷊,䷋,䷌,䷍,䷎,䷏,䷐,䷑,䷒,䷓,䷔,䷕,䷖,䷗,䷘,䷙,䷚,䷛,䷜,䷝,䷞,䷟,䷠,䷡,䷢,䷣,䷤,䷥,䷦,䷧,䷨,䷩,䷪,䷫,䷬,䷭,䷮,䷯,䷰,䷱,䷲,䷳,䷴,䷵,䷶,䷷,䷸,䷹,䷺,䷻,䷼,䷽,䷾,䷿'.split(',');

const TBook='书名'
const TBookName='书名'
const TBookMeta='meta'
const TGua = '卦'
const TGuaName = '卦名'
const TGuaUp = '卦上'
const TGuaDown = '卦下'
const TGuaCi = '卦辞'
const TJiJie = '集解'
const TShiWen = '释文'
const TZhu = '注'
const TYao = '爻'
const TTuan = '彖'
const TDaXiang = '大象'
const TXiaoXiang = '小象'
const TWenYan = '文言'
const TBracket = '括号'
const TLine = '句'

/*
书名->《xxxx》 
书-> 书名 集解
卦名->
	卦符
	卦上
	卦下
	卦辞
		注解
	爻辞
	*/


class Node {
	value=''
	type=null
	children=[]
	parent=null

	constructor(type=null, text='') {this.type=type;this.value=text}

	addChild(node) {
		this.children.push(node)
	}

	toJSON() {
		var res = {}
		if(this.type) res.type = this.type
		if(this.value) res.value=this.value
		if(this.children && this.children.length) res.children = this.children
		return res
	}
}

function parseJiJie(line) {
	if(line.startsWith('【集解】')) {
		line = line.substring(4)
		let mlist = line.matchAll(/(.+?)(［.+?］)/g)
		// let mlist = line.matchAll(/(([\u4e00-\u9fa5]+?)(又?曰|又?云)?：(.+?))+(［.+?］)/g)
		let list = []
		for(let m of mlist) {
			list.push({
				text: m[1],
				book: m[2],
			})
		}
		return {
			type: TJiJie,
			list: list,
		}
	}
	return null
}

function parseShiWen(line) {
	return parseStartToken(line, ['［釋文］'], TShiWen)
}

function parseGuaName(line) {
	let m = /([\u4dc0-\u4dff])?[\s|　]*([\u4e00-\u9fa5]+)卦[\s|　]*(.)下(.)上/.exec(line)
	// let m = /([\u4e00-\u9fa5]+)卦[\s|　]*(.)下(.)上/.exec(line)
	return m && {
		type: TGua,
		fh: m[1],
		name: m[2],
		down: m[3],
		up: m[4],
		lines: [],
	}
}

function parseBrackets(line) {
	if(line[0] == '（' && line[line.length - 1] == '）') {
		return {
			type: TBracket,
			text: line,
		}
	}
}

function parseStartToken(line, tokens, type) {
	for(let token of tokens) {
		if(line.startsWith(token)) {
			return {
				type: type,
				text: line.substring(token.length),
				// line: line,
			}
		}
	}
}

function parseZhu(line) {
	return parseStartToken(line, ['【注】', '注云：'], TZhu)
}

function parse(lines) {
	let root = null
	let current = null
	let currentLine = null

	function parseLine(line) {
		let res = parseJiJie(line) || parseShiWen(line) || parseBrackets(line) || parseZhu(line)
		if(res) {
			if(currentLine) {
				(currentLine.children || (currentLine.children = [])).push(res)
				// console.log('current', current)
			}
			return
		}
		let state = current && current.type
		if(state == null || state == TBook) {
			// 卦
			let gua = parseGuaName(line)
			if(gua) {
				current = gua
				return gua
			}
		}
		if(state == null) {
			// 书信息
			if(line[0] == '《') {
				currentLine = new Node(TLine, line)
				current = {
					type: TBook,
					lines: [currentLine],
				}
				return current
			}
			// 其他忽略
			return
		}
		if(state == TGua || state == TDaXiang || state == TYao) {
			// 彖
			if(line.startsWith('《彖》曰：') || line.startsWith('彖曰：')) {
				currentLine = new Node(TLine, line)
				current = {
					type: TTuan,
					lines: [currentLine]
				}
				return current
			}
		}
		if(state == TGua || state == TTuan) {
			// 象
			if(line.startsWith('《象》曰：') || line.startsWith('象曰')) {
				currentLine = new Node(TLine, line)
				current = {
					type: TDaXiang,
					lines: [currentLine]
				}
				return current
			}
		}
		if(state == TGua || state == TTuan || state == TDaXiang) {
			// 初九/初六
			if(line[0]=='初' && (line[1]=='九' || line[1]=='六')) {
				currentLine = new Node(TLine, line)
				current = {
					type: TYao,
					index: 1,
					lines: [currentLine],
				}
				return current
			}
		}
		if(state == TYao || state == TXiaoXiang) {
			if(
				(current.index == 5 && line[0]=='上' && (line[1] =='九' || line[1] == '六')) || // 上九/上六
				(current.index < 5 && (line[0]=='九'||line[0]=='六') && line[1] == '二三四五'[current.index - 1]) || // 六二、九三、六四、九五
				(current.index == 6 && line[0]=='用' && (line[1] =='九' || line[1] == '六')) // 用九/用六
			){
				currentLine = new Node(TLine, line)
				current = {
					type: TYao,
					index: current.index+1,
					lines: [currentLine]
				}
				return current
			}
		}
		if(state == TYao) {
			if(line.startsWith('《象》曰：') || line.startsWith('象曰：')) {
				currentLine = new Node(TLine, line)
				current = {
					type: TXiaoXiang,
					index: current.index,
					lines: [currentLine]
				}
				return current
			}
		}
		if(line.startsWith('《文言》曰：') || line.startsWith('文言曰：')) {
			currentLine = new Node(TLine, line)
			current = {
				type: TWenYan,
				lines: [currentLine]
			}
			return current
		}

		if(current) {
			currentLine = new Node(TLine, line)
			current.lines.push(currentLine)
			return
		}

		console.log('unknown', line)
	}

	root = new Node()
	for(let line of lines) {
		let res = parseLine(line)
		if(res!=null) {
			root.addChild(res)
		}
	}
	return root
}

function parseEBook(bookName, dataFolder) {
	for (let i = 1; i <= 64; i++) {
		let lines = require('./' + bookName + '/' + i + '.json')
		let data = parse(lines)
		if(!fs.existsSync(dataFolder)) {
			fs.mkdirSync(dataFolder)
		}
		fs.writeFileSync( dataFolder + '/' + i + '.json', JSON.stringify(data, '', 2))
	}
}

parseEBook('周易集解', './data/jijie')
parseEBook('王弼注', './data/wangzhu')
parseEBook('周易正义[孔颖达疏]', './data/zhengyi')
