import { printMessages, keyPathToValue } from '../helpers/mixed.mjs'
import fs from 'fs'


export class ProjectImporter {
    #config


    constructor( { validate } ) {
        this.#config = { validate }

        return true
    }


    async addProject( { projectPath } ) {
        const [ messages, comments ] = this.#validateAddProject( { projectPath } ) 
        printMessages( { messages, comments } )

        let json, filePath
        if( projectPath.startsWith( 'https://' ) ) {
            // public import here <<<---->>>
        } else {
            filePath = `./templates/${projectPath}.mjs`
            try {
                // import * as data from `./templates/${projectPath}`
                const { struct } = await import( filePath )
                json = struct 
                // console.log( 'struct', struct )
            } catch( e ) {
                messages.push( `File '${filePath}' is not found.` )
            }
        }
        printMessages( { messages, comments } )

        const [ m, c ] = this.#validateImportStruct( { json, filePath } ) 
        printMessages( { 'messages': m, 'comments': c } )

        console.log( 'END' )

        return true
    }


    #validateAddProject( { projectPath } ) {
        const messages = []
        const comments = []

        if( typeof projectPath === 'undefined' ) {
            messages.push( `Key 'projectPath' is mssing.` )
        } else if( typeof projectPath !== 'string' ) {
            messages.push( `Key 'projectPath' is not type string.` )
        }

        return [ messages, comments ]
    }


    #validateImportStruct( { json, filePath } ) {
        function checkKey( { id, name, key, validation, type, config, data } ) {
            const messages = []
            const comments = []
            const value = keyPathToValue( { data, 'keyPath': key } )
            const regex = keyPathToValue( { 'data': config, 'keyPath': validation } )

            let test = null
            switch( type ) {
                case 'string':
                    if( typeof value === undefined ) {
                        test = false
                        messages.push(`'${id}', key '${name}' is 'undefined'.` )
                    } else if( typeof value !== 'string' ) {
                        test = false
                        messages.push( `'${id}', key '${name}' is type of 'string'.` )
                    } else if( !regex['regex'].test( `${value}` ) ) {
                        test = false
                        messages.push( `'${id}', key '${name}' is not a valid pattern. ${regex['description']}` )
                    } else {
                        test = true
                    }
                    break
                case 'array':
                    if( !Array.isArray( value ) ) {
                        messages.push( `'${id}', key '${name}' is type of 'array'.` )
                        test = false
                    } else {
                        test = value
                            .map( v =>  regex['regex'].test( v ) )
                            .every( a => a )

                        if( !test ) {
                            messages.push( `'${id}', key '${name}' is not a valid pattern. ${regex['description']}` )
                        }
                    } 
                    break
                default:
                    console.log( 'k', key )
                    console.log( 'y', name )
                    console.log( `Unknown Type: ${type}.` )
                    break
            }

            return [ messages, comments ]
        }


        let messages = []
        let comments = []

        if( typeof json !== 'object' || json === null || Array.isArray( json ) ) {
            messages.push( `Json is not type of 'object'` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        this.#config['validate']['files']['importPayload']['root']
            .forEach( a => {
                const { name, key, validation, type, required } = a
                console.log( 'type', type )
                const [ m, c ] = checkKey( { 
                    id: `filepath '${filePath}', root `,
                    name, 
                    key,
                    validation, 
                    type,
                    'config': this.#config,
                    'data': json
                } )

                if( required ) {
                    messages = [ ...messages, ...m ]
                    comments = [ ...comments, ...c ]
                }
            } )

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        Object
            .entries( json )
            .filter( ( [ k, v ] ) => [ 'contracts', 'demos' ].includes( k ) )
            .forEach( a => {
                const [ k, values ] = a
                values
                    .forEach(( data, index ) => {
                        this.#config['validate']['files']['importPayload'][ k ]
                            .forEach( b => {
                                const { name, key, validation, type, required } = b
                                console.log( 'key', key )


                                console.log( 'type', type )
                                const [ m, c ] = checkKey( { 
                                    id: `filepath '${filePath}', folder '${k}[${index}]' `,
                                    name, 
                                    key,
                                    validation, 
                                    type,
                                    'config': this.#config,
                                    data 
                                } )
                
                                if( required ) {
                                    messages = [ ...messages, ...m ]
                                    comments = [ ...comments, ...c ]
                                }
                            } )

                    } )

            } )

        return [ messages, comments ]
    }
}