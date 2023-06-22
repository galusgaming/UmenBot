import test from 'ava'
import {parse as th} from '../src'

test('parse', t => {
  const input = `
    | name     | age |
    | sihle    | 100 |
    | jonathan | 99  |
  `

  const expected = [{age: 100, name: "sihle"}, {age: 99, name: "jonathan"}]

  const actual = th(input)

  t.deepEqual(actual, expected)

})
