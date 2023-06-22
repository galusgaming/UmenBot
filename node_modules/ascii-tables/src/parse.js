module.exports = function parse(input) {
  return input
    .split('\n')
    .map(line => line.replace(/\s*/g, ''))
    .filter(line => line != '')
    .map(line => line.split('|'))
    .map(line => line.filter(cell => cell != ''))
    .map(line => line.map(cell => Number.isNaN(Number(cell)) ? cell : Number(cell)))
    .reduce((acc, line, index) => {
      if (!acc.headers.length) {
        acc.headers = line
        return acc
      } else {
        const row = zipObject(acc.headers, line)
        acc.rows.push(row)
        return acc
      }
    }, {headers: [], rows: []})
    .rows
}

function zipObject (props, values) {
  return props.reduce((acc, prop, index) => {
    acc[prop] = values[index]
    return acc
  }, {})
}
