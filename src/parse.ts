// building JSON parse from scratch

const NUMBER_REGEX = /^-?\d+(\.\d+)?$/

const OPEN_BRACE = '{'
const CLOSE_BRACE = '}'

function isNumber(value: string): boolean {
  return NUMBER_REGEX.test(value)
}

function parseObject(input: string) {
  if (input === '{}') return {}

  const obj: Record<string, unknown> = {}
  let currentDepth = 0 // 1 means we are at the root level. 0 means we are outside of the object.
  let keyStartIndex = -1
  let valueStartIndex = -1
  let isInString = false
  let currentKey = ''

  for (let i = 0; i < input.length; i++) {
    const currentChar = input[i]

    // Toggle the string state when encountering quotes.
    if (currentChar === '"') {
      isInString = !isInString

      // Exiting or entering a string.
      if (!isInString) {
        // What: Check if we've just finished reading a key.
        // Why: To extract and set the current key.
        if (keyStartIndex !== -1 && currentKey === '') {
          currentKey = extractKey(input, keyStartIndex, i)
        }
      } else {
        // What: Mark the start index of a key.
        // Why: To know where to start extracting the key.
        keyStartIndex = i
      }
      continue
    }

    if (isInString) continue

    // What: Check if we are entering a new object.
    // Why: To increment the depth indicating a new level of nesting.
    if (currentChar === '{') {
      currentDepth++
      continue
    }

    // What: Check if we are exiting an object.
    // Why: To decrement the depth and process the completed object or value.
    if (currentChar === '}') {
      currentDepth--

      // What: Check if we've reached the end of the object.
      // Why: To extract and assign the value to the current key, then reset for the next key-value pair.
      if (currentDepth === 0 && currentKey) {
        const value = extractValue(input, valueStartIndex, i)
        obj[currentKey] = parseValue(value)
        currentKey = ''
      }
      continue
    }

    // What: Check if we've reached the separator between a key and its value.
    // Why: To mark the start of the value.
    if (currentChar === ':' && currentDepth === 1) {
      // Always set to a new value, that's why we're not resetting it elsewhere.
      valueStartIndex = i + 1
      continue
    }

    // What: Check if we've reached the end of a value at the root level.
    // Why: To extract and assign the value to the current key, then reset for the next key-value pair.
    if ((currentChar === ',' || currentChar === '}') && currentDepth === 1) {
      const value = extractValue(input, valueStartIndex, i)
      obj[currentKey] = parseValue(value)
      currentKey = ''
    }
  }

  return obj
}

function extractKey(input: string, start: number, end: number) {
  // trim needed to remove spaces around the key.
  return input.substring(start + 1, end).trim()
}

function extractValue(input: string, start: number, end: number) {
  // trim needed to remove spaces around the value.
  return input.substring(start, end).trim()
}

function parseValue(value: string) {
  // if object, parse it recursively
  return value.startsWith('{') ? parseObject(value) : parse(value)
}

function parseString(input: string) {
  // Function to extract a string, removing the surrounding quotes.
  return input.startsWith('"') && input.endsWith('"')
    ? input.slice(1, -1)
    : input
}

export function parse(input: string) {
  if (input === 'null') return null
  if (input === 'true') return true
  if (input === 'false') return false
  if (isNumber(input)) return Number(input)

  const isObject = input.startsWith(OPEN_BRACE) && input.endsWith(CLOSE_BRACE)
  if (isObject) {
    return parseObject(input) // Parse the inner content of the object
  }

  return parseString(input)
}
