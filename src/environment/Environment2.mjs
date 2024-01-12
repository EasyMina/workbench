import fs from 'fs'
import path from 'path'
import moment from 'moment'

import { printMessages, keyPathToValue } from './../helpers/mixed.mjs'


export class Environment {
    #config
    #state


    constructor( { validate, secret, typescript } ) {
        this.#config = { validate, secret, typescript }

        this.#state = {
            'folders': {
                'accounts': [ 
                    'validate__folders__credentials__name',
                    'validate__folders__credentials__subfolders__accounts__name'
                ],
                'contracts': [
                    'validate__folders__credentials__name',
                    'validate__folders__credentials__subfolders__contracts__name'
                ],
                'workdir': [ 
                    'validate__folders__workdir__name'
                ]
            },
            'secret': [
                'validate__folders__credentials__name',
                'secret__fileName'
            ]
        }

        this.#state['folders'] = Object
            .entries( this.#state['folders'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                acc[ key ] = value
                    .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )
                    .join( '/' )
                return acc
            }, {} )

        this.#state['secret'] = this.#state['secret']
            .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )
            .join( '/' )

        return true
    }

/*
    init( { accountGroup, projectName } ) {
        this.#state = {
            accountGroup,
            projectName
        }

        return true
    }
*/

    getStatus( { encryption } ) {
        const result = {
            'secret': null, 
            'folders': null
        }

        result['secret'] = this.getSecret( { encryption } )
        result['folders'] = Object
            .entries( this.#state['folders'] )
            .reduce( ( acc, a, index ) => {
                const [ key, path ] = a 
                try {
                    fs.accessSync( path, fs.constants.F_OK )
                    acc[ key ] = {
                        path, 'status': true
                    }
                } catch( e ) {
                    acc[ key ] = {
                        path, 'status': false
                    }
                }
                return acc
            }, {} )

        return result
    }


    setFolderStructure( { encryption } ) {
        const status = this.getStatus( { encryption } )
        Object
            .entries( status['folders'] )
            .filter( a => !a[ 1 ]['status'] )
            .forEach( a => {
                const [ key, value ] = a
                fs.mkdirSync( value['path'], { 'recursive': true } )
            } )
 
        return true
    }

/*
    updateFolderStructure( { folderType, projectName } ) {
        const credentials = [
            [ 
                [ 'validate__folders__credentials__name', 'config' ]
            ],
            [ 
                [ 'validate__folders__credentials__name', 'config' ],
                [ 'validate__folders__credentials__subfolders__accounts__name', 'config' ]
            ],
            [
                [ 'validate__folders__credentials__name', 'config' ],
                [ 'validate__folders__credentials__subfolders__contracts__name', 'config' ] 
            ],
        ]

        const workdir = [
            [
                [ 'validate__folders__workdir__name', 'config' ]
            ],
            [
                [ 'validate__folders__workdir__name', 'config' ],
                [ projectName, 'state' ]
            ],
            [
                [ 'validate__folders__workdir__name', 'config' ],
                [ projectName, 'state' ],
                [ 'validate__folders__workdir__subfolders__subfolders__backend__name', 'config' ]
            ],
            [
                [ 'validate__folders__workdir__name', 'config' ],
                [ projectName, 'state' ],
                [ 'validate__folders__workdir__subfolders__subfolders__frontend__name', 'config' ]
            ]
        ]


        let selection

        switch( folderType ) {
            case 'credentials':
                selection = credentials
                break
            case 'workdir':
                selection = workdir
                break
            default:
                console.log( `FolderType '${folderType}' is not known.` )
                process.exit( 1 )
                break
        }

        selection
            .forEach( cmds => {
                const path = cmds
                    .map( cmd => {
                        const [ keyPath, type ] = cmd
                        let value = ''
                        switch( type ) {
                            case 'config': 
                                value = keyPathToValue( { 'data': this.#config, keyPath } )
                                break
                            case 'state':
                                value = keyPath // keyPathToValue( { 'data': this.#state, keyPath } )
                                break
                            default:
                                console.log( 'Something went wrong!' )
                                process.exit( 1 )
                                break
                        }
                        return value
                    } )
                    .join( '/' )

                if( !fs.existsSync( path ) ) {
                    fs.mkdirSync( path )
                }
            } )

        return true
    }
*/

    getSecret( { encryption } ) {
        const result = {
            'env': {
                'filePath': null,
                'exists': false,
                'secret': null,
                'id': null,
                'valid': false
            },
            'local': {
                'filePath': null,
                'exists': false,
                'secret': null,
                'id': null,
                'valid': false
            }
        }

        if( !Object.hasOwn( process.env, this.#config['secret']['envKey'] ) ) {} 
        else if( typeof process.env[ this.#config['secret']['envKey'] ] === 'string' ) {
            try {
                fs.accessSync(
                    process.env[ this.#config['secret']['envKey'] ], 
                    fs.constants.F_OK 
                )
                result['env']['exists'] = true
                result['env']['filePath'] = process.env[ this.#config['secret']['envKey'] ]

            } catch ( err ) {}
        } else {}

        try {
            fs.accessSync(
                this.#state['secret'], 
                fs.constants.F_OK 
            )
            result['local']['exists'] = true
            result['local']['filePath'] = this.#state['secret']
        } catch ( err ) {}

        Object
            .entries( result )
            .filter( a => a[ 1 ]['exists'] )
            .forEach( a => {
                const [ key, value ] = a
                const { filePath } = value
                const content = this.#loadSecretFromFilePath( { filePath } )
                if( content['secret'] === null ) {} 
                else if( encryption.validateSecret( { 'secret': content['secret'] } )[ 0 ].length !== 0 ) {} 
                else {
                    result[ key ]['secret'] = content['secret']
                    result[ key ]['id'] = `${content['id']}`
                    result[ key ]['valid'] = true
                }
            } )

        const choosen = Object
            .entries( result )
            .filter( a => a[ 1 ]['valid'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                if( acc['secret'] === null ) {
                    acc['secret'] = value['secret']
                    acc['id'] = value['id']
                    acc['type'] = key
                }
                return acc
            }, { 'secret': null, 'type': null } )

        return choosen
    }

/*
    getSecret() {
        const files = detectSecretFile()


        result
    }


    getSecret( { filePath=null, encryption } ) {
        const [ messages, comments ] = this.#validateGetSecret( { filePath } )
        printMessages( { messages, comments } )

        filePath = this.#chooseSecretFilePathRoute( { filePath } )

        const [ m, c ] = this.#validateSecretFilePath( { filePath, encryption } )
        printMessages( { 'messages': m, 'comments': c } )

        const result = this.#loadSecretFromFilePath( { filePath } )
        return result
    }
*/

    createSecretFile( { encryption } ) {
        const struct = {
            'id': null
        }

        struct['id'] = `se-${moment().unix()}`
        struct[ this.#config['secret']['jsonKey'] ] =
            encryption.createSecretValue()

        const directoryPath = path.dirname( this.#state['secret'] )
        fs.mkdirSync(directoryPath, { 'recursive': true } )

        fs.writeFileSync( 
            this.#state['secret'], 
            JSON.stringify( struct, null, 4 ), 
            'utf-8' 
        )

        return true
    }


    getAccounts( { account, encrypt } ) {
        const path = [ 
            'validate__folders__credentials__name',
            'validate__folders__credentials__subfolders__accounts__name'
        ]
            .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )
            .join( '/' )
  
        const result = fs
            .readdirSync( path )
            .sort( ( a, b ) => {
                if( a > b ) { return -1 } 
                else if( a < b ) { return 1 } 
                else { return 0 }
            } )
            .reduce( ( abb, file ) => {
                const filePath = `${path}/${file}`
                if( !fs.statSync( filePath ).isDirectory() ) {
                    if( filePath.endsWith( '.json' ) ) {
                        const [ messages, comments ] = account
                            .validate( { filePath, encrypt } )
                        if( messages.length === 0 ) {
                            const tmp = fs.readFileSync( filePath, 'utf-8' )
                            const credential = encrypt.decryptCredential( {
                                'credential': JSON.parse( tmp )
                            } )

                            const struct = {
                                filePath, 
                                ...credential['header']
                            }

                            abb.push( struct )
                        }
                    }
                }
                return abb
            }, [] )
            .reduce( ( abb, item ) => {
                const { groupName } = item
                !Object.hasOwn( abb, groupName ) ? abb[ groupName ] = {} : ''

                let key = item['name']
                if( Object.hasOwn( abb[ groupName ], item['name'] ) ) {
                    key += '-'
                    key += Object
                        .keys( abb[ groupName ] )
                        .filter( a => a.startsWith( key ) )
                        .length + 1
                }

                abb[ groupName ][ key ] = item

                return abb
            }, {} )
        return result
    }


    getProjectNames() {
        const workdir = this.#config['validate']['folders']['workdir']['name']
        const projectNames = fs
            .readdirSync( workdir )
            .filter( item => {
                const path = `${workdir}/${item}`
                return fs.statSync( path ).isDirectory()
            } )
            .filter( ( v, i, a ) => a.indexOf( v ) === i )

        return projectNames
    }


    getDevelopmentContracts() {
        const projectNames = this.getProjectNames()
        const result = projectNames
            .reduce( ( acc, projectName, index ) => {
                acc[ projectName ] = this.#getDevelopmentContractsByProjectName( { 
                    projectName 
                } )
                return acc
            }, {} )

        return result
    }


    getDeployedContracts( { contract, encrypt } ) {
        const path = [ 
            'validate__folders__credentials__name',
            'validate__folders__credentials__subfolders__contracts__name'
        ]
            .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )
            .join( '/' )

        const result = fs
            .readdirSync( path )
            .sort( ( a, b ) => {
                if( a > b ) { return -1 } 
                else if( a < b ) { return 1 } 
                else { return 0 }
            } )
            .reduce( ( abb, file ) => {
                const filePath = `${path}/${file}`
                if( !fs.statSync( filePath ).isDirectory() ) {
                    if( filePath.endsWith( '.json' ) ) {
                        const [ messages, comments ] = contract
                            .validateCredential( { filePath, encrypt } )
                        if( messages.length === 0 ) {
                            const tmp = fs.readFileSync( filePath, 'utf-8' )
                            const credential = encrypt.decryptCredential( {
                                'credential': JSON.parse( tmp )
                            } )

                            const struct = {
                                filePath, 
                                ...credential['header']
                            }

                            abb.push( struct )
                        } else {
                            console.log( messages )
                        }
                    }
                }
                return abb
            }, [] )
            .reduce( ( abb, item ) => {
                const { projectName } = item
                !Object.hasOwn( abb, projectName ) ? abb[ projectName ] = {} : ''

                let key = item['name']
                if( Object.hasOwn( abb[ projectName ], item['name'] ) ) {
                    key += '-'
                    key += Object
                        .keys( abb[ projectName ] )
                        .filter( a => a.startsWith( key ) )
                        .length + 1
                }

                abb[ projectName ][ key ] = item

                return abb
            }, {} )

        return result
    }


    getScripts() {
        const cmdGroups = {
            'backend': [
                [ [ /\.js$/, /\.mjs$/ ], 'source' ],
                [ [ /\.md$/ ], 'md' ]
            ],
            'frontend': [
                [ [ /\.html$/ ], 'source' ],
                [ [ /\.md$/ ], 'md' ]
            ]
        }

        const result = this.getProjectNames()
            .reduce( ( acc, projectName, index ) => {
                acc[ projectName ] = Object
                    .entries( cmdGroups )
                    .reduce( ( abb, b, rindex ) => {
                        const [ key, cmds ] = b
                        abb[ key ] = this.#getScriptsByProjectName( {
                            projectName,
                            cmds,
                            key
                        } )
                        return abb
                    }, {} )

                return acc
            }, {} )

        return result
    }


    async getScriptMethods( { contractAbsolutePath } ) {
        let result = {}
        try {
            const ContractClass = await import( contractAbsolutePath )
            result = Object
                .entries( ContractClass )
                .reduce( ( acc, a, index ) => {
                    const [ key, value ] = a
                    if( Object.hasOwn( value, '_methods') ) {
                        acc[ key ] = value['_methods']
                            .map( a => a['methodName'] )
                    }
                    return acc
                }, {} )
        } catch( e ) {
        }

        return result
    }


    #getScriptsByProjectName( { projectName, cmds, key } ) {
        const path = [
            this.#config['validate']['folders']['workdir']['name'],
            projectName,
            this.#config['validate']['folders']['workdir']['subfolders']['subfolders'][ key ]['name']
        ]
            .join( '/' )

        const result = cmds
            .reduce( ( acc, a, index ) => {
                const [ search, key ] = a 
                fs
                    .readdirSync( path )
                    .filter( file => {
                        const stats = fs.statSync( `${path}/${file}` )
                        return stats.isFile()
                    } )
                    .forEach( file => {
                        const test = search
                            .map( a => a.test( file ) )
                            .some( a => a )

                        if( test ) {
                            const id = file.split( '.' )[ 0 ]
                            if( !Object.hasOwn( acc, id ) ) {
                                acc[ id ] = {}
                                cmds.forEach( a => acc[ id ][ a[ 1 ] ] = '' )
                            }

                            acc[ id ][ key ] =  `${path}/${file}`
                        }
                    } )
                return acc
            }, {} )

        return result
    }


    #getDevelopmentContractsByProjectName( { projectName } ) {
        const pathContracts = [
            process.cwd(),
            this.#config['validate']['folders']['workdir']['name'],
            projectName,
            this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['contracts']['name']
        ]
            .join( '/' )

        let pathBuilds = ''
        pathBuilds += `${pathContracts}/`
        pathBuilds += this.#config['typescript']['buildFolderName']

        const cmds = [
            [ pathContracts, '.ts', 'ts' ],
            [ pathBuilds, '.js', 'js' ]
        ]

        const contracts = cmds
            .reduce( ( acc, a, index ) => {
                const [ path, search, key ] = a 
                fs
                    .readdirSync( path )
                    .filter( file => {
                        const stats = fs.statSync( `${path}/${file}` )
                        return stats.isFile()
                    } )
                    .forEach( file => {
                        if( file.endsWith( search ) ) {
                            const id = file.split( search )[ 0 ]
                            if( !Object.hasOwn( acc, id ) ) {
                                acc[ id ] = {}
                                cmds.forEach( a => acc[ id ][ a[ 2 ] ] = '' )
                            }

                            acc[ id ][ key ] =  `${path}/${file}`
/*
                            if( search === '.js' ) {
                                acc[ id ]['methods'] = this.getScriptMethods( { 
                                    'contractAbsolutePath': `${path}/${file}`
                                } )
                            }
*/
                        }
                    } )
                return acc
            }, {} )

        return contracts
    }


    #loadSecretFromFilePath( { filePath } ) {
        const result = {
            'secret': null,
            'id': null
        }

        try {
            const rows = fs.readFileSync( filePath, 'utf-8' )
            const json = JSON.parse( rows )
            if( !Object.hasOwn( json, this.#config['secret']['jsonKey'] ) ) {
            } else if( typeof json[ this.#config['secret']['jsonKey'] ] !== 'string' ) {
            } else {
                result['secret'] = json[ this.#config['secret']['jsonKey'] ]
                result['id'] = json['id']
            }
        } catch( e ) {} 
        return result
    }

/*
    #loadSecretFromFilePath( { filePath } ) {
        const rows = fs.readFileSync( filePath, 'utf-8' )
            .split( "\n" )

        const rowIndex = rows
            .findIndex( a => a.startsWith( this.#config['secret']['key'] ) )

        const secret = rows[ rowIndex ]
            .split( '=' )[ 1 ]

        return secret
    }
*/

    #chooseSecretFilePathRoute( { filePath } ) {
        if( filePath === null ) {
            filePath = [
                this.#config['validate']['folders']['credentials']['name'],
                this.#config['secret']['fileName']
            ]
                .join( '/' )
        }

        return filePath
    }


    #validateSecretFilePath( { filePath, encryption } ) {
        let messages = []
        let comments = []

        try {
            fs.accessSync( filePath, fs.constants.F_OK )
        } catch ( err ) {
            messages.push( `Secret .env file '${filePath}' does not exist.` )
        }

        if( messages.length === 0 ) {
            const tmp = fs.readFileSync( filePath, 'utf-8' )
            const rows = tmp
                .split( "\n" )

            const rowIndex = rows
                .findIndex( a => a.startsWith( this.#config['secret']['key'] ) )

            if( rowIndex === -1 ) {
                messages.push( `Secret .env does not start with key '${this.#config['secret']['key']}'.` )
            } else if( !rows[ rowIndex ].includes( '=' ) ) {
                messages.push( `Secret .env starts with key '${this.#config['secret']['key']}' splitter '=' is missing.` )
            } else {
                const value = rows[ rowIndex ].split( '=' )[ 1 ]
                if( value === '' ) {
                    messages.push( `Secret .env contains key '${this.#config['secret']['key']}' but value is ''.` )
                } else {
                    const [ m, c ] = encryption.validateSecret( { 'secret': value } )
                    messages = [ ...messages, ...m ]
                }
            }
        }

        return [ messages, comments ]
    }


    #validateGetSecret( { filePath } ) {
        const messages = []
        const comments = []

        if( typeof filePath !== 'string' && filePath !== null ) {
            messages.push( `Key 'filePath' is not type of 'string' or 'null'.` )
        }

        return [ messages, comments ]
    }
}