function printMessages( { messages=[], comments=[] } ) {
    const n = [
        [ comments, 'Comment', false ],
        [ messages, 'Message', true ]
    ]
        .forEach( ( a, index ) => {
            const [ msgs, headline, stop ] = a
            msgs
                .forEach( ( msg, rindex, all ) => {
                    rindex === 0 ? console.log( `\n${headline}${all.length > 1 ? 's' : ''}:` ) : ''
                    console.log( `  - ${msg}` )
                    if( ( all.length - 1 ) === rindex ) {
                        if( stop === true ) {
                            throw new Error("")
                        }
                    }
                } )
        } )

    return true
}


function keyPathToValue( { data, keyPath, separator='__' } ) {
    if( typeof keyPath !== 'string' ) {
        return undefined
    }

    const result = keyPath
        .split( separator )
        .reduce( ( acc, key, index ) => {
            if( !acc ) return undefined
            if( !Object.hasOwn( acc, key ) ) return undefined
            acc = acc[ key ]
            return acc
        }, data )

    return result
}


function shortenAddress( { publicKey } ) {
    return `${publicKey.slice( 0, 8 )}...${publicKey.slice( -4 )}`
}


export { printMessages, keyPathToValue, shortenAddress }