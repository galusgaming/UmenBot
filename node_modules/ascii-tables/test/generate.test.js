import test from 'ava'
import {generate} from '../src'

test('generate with formatting', t => {
  const input = [{name: "sihle", age: 100}, {name: "jonathan", age: 99}]

  const expected = '' +
'| name     | age |\r' +
'| sihle    | 100 |\r' +
'| jonathan | 99  |'

  const actual = generate(input)

  t.deepEqual(actual, expected)

})
