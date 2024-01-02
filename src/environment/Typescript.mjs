import { printMessages } from './../helpers/mixed.mjs'
import fs from 'fs'


export class Typescript {
    #config

    constructor( { typescript, validate } ) {
        this.#config = { typescript, validate }
        return true
    }


    addConfigs( { environment } ) {
        const projectFolders = environment
            .getProjectNames()
            .map( projectName => {
                const struct = [
                    [ 
                        'configPath', 
                        [ 'tsconfig.json' ] 
                    ],
                    [
                        'rootDir',
                        [ this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['contracts']['name'] ]
                    ],
                    [
                        'outDir',
                        [
                            this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['contracts']['name'],
                            this.#config['typescript']['buildFolderName']
                        ]
                    ]
                ]
                    .reduce( ( acc, a, index ) => {
                        const [ key, values ] = a
                        if( !Object.hasOwn( acc, projectName ) ) {
                            acc[ projectName ] = {} 
                        }
                        acc[ projectName ][ key ] = values.join( '/' )
                        return acc
                    }, {} )

                return struct
            } ) 

        const [ messages, comments ] = projectFolders
            .reduce( ( acc, a, index ) => {
                const projectName = Object.keys( a )[ 0 ]
                const { configPath, rootDir, outDir } = a[ projectName ]

                const p = [
                    this.#config['validate']['folders']['workdir']['name'],
                    projectName,
                ]
                    .join( '/' )

                const [ m, c ] = this.#validateConfig( { 
                    'configPath': [ p, configPath ].join( '/' ) , 
                    'rootDir': [ p, rootDir ].join( '/' ), 
                    'outDir': [ p, outDir ].join( '/' ) 
                } )
                acc[ 0 ] = acc[ 0 ].concat( m )
                acc[ 1 ] = acc[ 1 ].concat( c )
                return acc
            }, [ [], [] ] )
        printMessages( { messages, comments } )

        projectFolders
            .forEach( a => {
                const projectName = Object.keys( a )[ 0 ]
                const { configPath, rootDir, outDir } = a[ projectName ] 

                const p = [
                    this.#config['validate']['folders']['workdir']['name'],
                    projectName,
                ]
                    .join( '/' )

                const tmp = [ 
                    [ p, rootDir ].join( '/' ), 
                    [ p, outDir ].join( '/' ) 
                ]
                    .forEach( path => {
                        if( !fs.existsSync( path ) ) {
                            fs.mkdirSync( path, { 'recursive': true } )
                        }
                    } )

                this.addConfig( { 
                    'configPath': [ p, configPath ].join( '/' ),
                    rootDir,
                    outDir,
                    'validation': false
                } )
            } )

        return true
    }


    addConfig( { configPath, rootDir, outDir, validation=true } ) {
        if( validation ) {
            const [ messages, comments ] = this.#validateConfig( { configPath, rootDir, outDir } )
            printMessages( { messages, comments } )
        }
 
        if( !fs.existsSync( configPath ) ) { 
            const template = JSON.parse( 
                JSON.stringify( this.#config['typescript']['template'] ) 
            )

            const tmp = [
                [ './' + outDir, 'outDir', 'exclude', '' ],
                [ './' + rootDir, 'rootDir', 'include', '/**/*.ts' ]
            ]
                .forEach( a => {
                    const [ value, key, type, add ] = a
                    template['compilerOptions'][ key ] = value
                    template[ type ] = [ `${value}${add}` ]
                } ) 

            fs.writeFileSync( 
                configPath, 
                JSON.stringify( template, null, 4 ),
                'utf-8'
            )
        }

        return true
    }


    #validateConfig( { configPath, rootDir, outDir } ) {
        const messages = []
        const comments = []

        const tmp = [
            [ configPath, 'configPath', 'tsconfig.json will be added' ], 
            [ rootDir, 'rootDir', 'Folder will be added' ], 
            [ outDir, 'outDir', 'Folder will be added' ]
        ]
            .forEach( a => {
                const [ value, key, msg ] = a
                if( typeof value !== 'string' ) {
                    messages.push( `Key '${key}' with the value '${value}' is not type of 'string'.` )
                } else if( !fs.existsSync( value ) ) {
                    comments.push( `Key '${key}' with the value '${value}' is not found. ${msg}.` )
                }
            } )

        if( messages.length !== 0 || comments.length !== 0 ) {
            return [ messages, comments ]
        }

        let json
        try {
            const txt  = fs.readFileSync( configPath, 'utf-8' )
            json = JSON.parse( txt )
        } catch( e ) {
            messages.push( `Typescript config file '${configPath}' is not a valid json.` )
        }

        if( messages.length === 0 ) {
            Object
                .entries( this.#config['typescript']['template'] )
                .forEach( a => {
                    const [ key, value ] = a
                    if( !Object.hasOwn( json, key ) ) {
                        messages.push( `Typescript config file, key '${key}' is missing.` )
                    } else if( 
                        typeof json[ key ] === 'object' &&
                        !Array.isArray( json[ key ] ) && 
                        json[ key ] !== null 
                    ) {
                        Object
                            .entries( value )
                            .forEach( b => {
                                const [ k, v ] = b
                                if( !Object.hasOwn( json[ key ], k ) ) {
                                    messages.push( `Typescript config file, key '${key}.${k}' is missing.` )
                                }
                            } )
                    }

                } )
        }

        return [ messages, comments ]
    }
}