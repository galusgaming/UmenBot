const separator = '|'

module.exports = function generate(rows) {

  const widths = rows.reduce((acc, row) => {
    Object.keys(row).forEach((cell_key, index) => {
      const len = row[cell_key].toString().length
      if (!acc[index]) acc[index] = 0
      if (len > acc[index]) acc[index] = len
    })
    return acc
  }, [])

  const pad_right = (count) => {
    return '                    '.slice(19 - count)
  }

  const format_row = (items) => {
    const padded_items = items.map((item, index) => {
      const width = widths[index]
      const pad_space = width - item.toString().length
      const padding = pad_right(pad_space)
      return ' ' + item + padding
    })
    return separator + padded_items.join(separator) + separator
  }

  return rows
    .reduce((acc, row, i) => {
      if (i === 0) acc.push(format_row(Object.keys(row)))
      acc.push(format_row(Object.values(row)))
      return acc
    }, [])
    .join('\r')
}
