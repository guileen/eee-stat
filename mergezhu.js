const fs = require('fs')

function getNormal(path) {
    let data = require(path);
    let res = {
        guazhu: [],
        guaci: [],
        yao: [],
        xiaoxiang: [],
    }
    for(const node of data.children) {
        if(node.type === '卦') {
            res.name = node.name
            res.down = node.down
            res.up = node.up
            for(const line of node.lines) {
                if(line.type == '句') {
                    res.guaci.push(line)
                } else if(line.type == '卦名') {
                    res.guazhu = line.children
                } else {
                    console.log('unknown', line)
                }
            }
        } else if(node.type === '彖') {
            res.tuan = node
        } else if(node.type === '大象') {
            res.daxiang = node
        } else if(node.type === '爻') {
            res.yao[node.index - 1] = node
        } else if(node.type === '小象') {
            res.xiaoxiang[node.index - 1] = node
        } else {
            console.log('unknown', node)
        }
    
    }
    // console.log('final', JSON.stringify(res, 0, 2))
    return res
}

function merge(index) {
    let data = {}
    for(let key of ['yz','jijie', 'wangzhu', 'ycz', 'zx', 'zhengyi']) {
        data[key] = getNormal(`./data/${key}/${index}.json`)
    }

    let res = {
        name : data.yz.name,
        down : data.yz.down,
        up : data.yz.up,
        guaci: {},
        tuan: {},
        yao: [],
        daxiang: {},
        xiaoxiang: [],
    }
    for(let key in data) {
        if(data[key].guazhu) {
            (res.guazhu || (res.guazhu = [])).push(data[key].guazhu)
        }
        res.tuan[key] = data[key].tuan
        res.daxiang[key] = data[key].daxiang
        res.guaci[key] = data[key].guaci
        for(let i=0;i<6;i++) {
            res.yao[i] = res.yao[i] || {}
            res.yao[i][key] = data[key].yao[i]
            res.xiaoxiang[i] = res.xiaoxiang[i] || {}
            res.xiaoxiang[i][key] = data[key].xiaoxiang[i]
        }
    }
    return res
}

function trimBook(lines, book) {
    let line = getLine(lines)
    if(!line) {
        console.log(i, book, 'empty line', line)
        return ''
    }
    return line.replace(`《${book}》曰：`,'').replace(`${book}曰：`, '')
}

function getLineWithZhu(lines) {
    if(!lines) return 'N/A'
    if(lines.lines) return getLine(lines.lines)
    let res = ''
    for(let line of lines) {
        if(line.type == '句') {
            res += line.value
            if(line.children) {
                for(let child of line.children) {
                    if(child.type == '注') {
                        res += '【' + child.text + '】'
                    }
                    if(child.type == '疏') {
                        for(let shu of child.lines) {
                            if(shu.type == '句') {
                                res += '[' + shu.value.replace('疏　','') + ']'
                            }
                        }
                    }
                }
            }
        }
    }
    return res 
}

function getLine(lines) {
    if(!lines) return 'N/A'
    if(lines.lines) return getLine(lines.lines)
    let res = ''
    for(let line of lines) {
        if(line.type == '句') {
            res += line.value
        }
    }
    return res
}
const fh = '䷀䷁䷂䷃䷄䷅䷆䷇䷈䷉䷊䷋䷌䷍䷎䷏䷐䷑䷒䷓䷔䷕䷖䷗䷘䷙䷚䷛䷜䷝䷞䷟䷠䷡䷢䷣䷤䷥䷦䷧䷨䷩䷪䷫䷬䷭䷮䷯䷰䷱䷲䷳䷴䷵䷶䷷䷸䷹䷺䷻䷼䷽䷾䷿'
let csv = '序,,卦,下,上,辞,象,彖,初,象,二,象,三,象,四,象,五,象,上,象,,,\r\n'
for(let i=1;i<=64;i++) {
    const data = merge(i)
    console.log(data.guaci.wangzhu)
    csv += i + ',' + fh[i-1] + ',' + data.name + ',' + data.down + ',' + data.up + ','
    csv += getLineWithZhu(data.guaci.zhengyi) + ',' + trimBook(data.daxiang.yz, '象') + ','
    csv += trimBook(data.tuan.yz, '彖') + ','
    for(let j=0;j<6;j++) {
        csv += getLine(data.yao[j].yz) + ',' + trimBook(data.xiaoxiang[j].yz, '象') + ','
    }
    csv += '\r\n'
}
fs.writeFileSync('./data/merge.csv', csv)
