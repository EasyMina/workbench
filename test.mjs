const messages = []
const variable = {}

if( variable === undefined ) {
    messages.push( `Key 'variable' is type of 'undefined'.` )
} else if( variable.constructor !== Object ) {
    messages.push( `Key 'variable' with the value '${variable}' is not type of 'object'.` )
}

console.log( messages )