import { PrivateKey } from 'o1js'
import { printMessages, keyPathToValue, shortenAddress } from './../helpers/mixed.mjs'
import fs from 'fs'
import moment from 'moment'


export class Contract {
    #config
    #state


    constructor( { validate, networks, contracts } ) {
        this.#config = { validate, networks, contracts }
        this.init()
    }


    init() {
        this.#state = {}
    }


    async request( { name, contractAbsolutePath, networkName, deployer, encrypt, environment } ) {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        const result = {
            'header': {
                name,
                'methods': [],
                'projectName': null,
                networkName,
                'addressShort': null,
                'addressFull': null,
                'explorer': null,
                'created': null,
                'deployer': null,
                'sourceCode': null,
                encrypt
            },
            'body': {
                'privateKey': {
                    'field': null,
                    'base58': null
                },
                'publicKey': {
                    'field': null,
                    'base58': null
                }
            },
            'disclaimer': null
        }

        result['body']['privateKey']['base58'] = PrivateKey
            .random()
            .toBase58()
        result['body']['privateKey']['field'] = PrivateKey
            .fromBase58( result['body']['privateKey']['base58'] )
        result['body']['publicKey']['field']  = result['body']['privateKey']['field']
            .toPublicKey()
        result['body']['publicKey']['base58'] = result['body']['publicKey']['field']
            .toBase58()

        result['header']['sourceCode'] = fs.readFileSync( contractAbsolutePath, 'utf-8' )
        result['header']['deployer'] = deployer['filePath']
        result['header']['projectName'] = environment
            .getProjectNames()
            .reduce( ( acc, projectName, index ) => {
                const result = contractAbsolutePath
                    .split( '/' )
                    .find( a => ( a === projectName ) )
                result !== undefined ? acc = result : ''
                return acc
            }, '' )
        result['header']['methods'] = await environment
            .getScriptMethods( { contractAbsolutePath } )
        result['header']['created'] = moment().format( 'YYYY-MM-DD hh:mm:ss A' )
        const publicKey = result['body']['publicKey']['base58']
        result['header']['addressShort'] = shortenAddress( { publicKey } )
        result['header']['addressFull'] = publicKey
        result['header']['explorer'] = this.#config['networks'][ networkName ]['explorer']['wallet']
            .replace( '{{publicKey}}', publicKey )

        result['disclaimer'] = this.#config['contracts']['disclaimer']

        this.#state['requestContract'] = result
        return result
    }


    async prepareSave( { encryption } ) {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        let contract = this.#state['requestContract']
        let credential = this.#state['requestContract']
        credential['body'] = {
            'account': {
                'publicKey': credential['body']['publicKey']['base58'],
                'privateKey': credential['body']['privateKey']['base58'],
            }
        }

        credential = encryption.encryptCredential( { credential } )
        return credential
    }


    getDeployedContract( { filePath, encryption } ) {
        const raw = fs.readFileSync( filePath )
        let credential = JSON.parse( raw )
        credential = encryption.decryptCredential( { credential } )

        const result = {
            'privateKey': {
                'base58': null,
                'field': null
            },
            'publicKey': {
                'base58': null,
                'field': null
            }
        }
        result['privateKey']['base58'] = credential['body']['account']['privateKey']
        result['privateKey']['field'] = PrivateKey
            .fromBase58( result['privateKey']['base58'] )
        result['publicKey']['field']  = result['privateKey']['field']
            .toPublicKey()
        result['publicKey']['base58'] = result['publicKey']['field']
            .toBase58()

        return result
    }


    #validateState( { state } ) {
        const messages = []
        const comments = []

        if( typeof state === 'undefined' ) {
            messages.push( `Class 'Contract' the variable 'state' is not initialized. Run .init() before.` )
        } else if (typeof state !== 'object' || state === null || Array.isArray( state ) ) {
            messages.push( `Class 'Contact' the variable 'state' is not type of '{}'.` )
        }

        return [ messages, comments ]
    }


    validateRequest( { name, contractAbsolutePath, networkName, deployer, encrypt } ) {
        const messages = []
        const comments = []

        if( typeof name !== 'string' ) {
            messages.push( `Key 'name' is not type of 'string'.` )
        } else if( !this.#config['validate']['values']['stringsAndDash']['regex'].test( name ) ) {
            messages.push( `Key 'name' with the value '${name}' has not the expected pattern. ${this.#config['validate']['values']['stringsAndDash']['description']}` )
        }

        if( contractAbsolutePath === null ) {
            comments.push( `Key 'sourceCode' is empty, will ignored.` )
        } else if( typeof contractAbsolutePath !== 'string' ) {
            messages.push( `Key 'sourceCode' is not type of 'string'.` )
        } else if( !fs.existsSync( contractAbsolutePath ) ) {
            messages.push( `Key 'sourceCode' provided path '${contractAbsolutePath}' is not valid.` )
        }

        if( typeof networkName !== 'string' ) {
            messages.push( `Key 'networkName' is not type of 'string'.` )
        } else if( networkName === '' ) {
            messages.push( `Key 'networkName' can not be ''. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ', ' )}.` )
        } else if( !this.#config['networks']['supported'].includes( networkName ) ) {
            messages.push( `Key 'networkName' with the value '${networkName}' is not a currently supported network. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ', ' )}.` )
        }

        if( typeof encrypt !== 'boolean' ) {
            messages.push( `Key 'encrypt' is not type of 'boolean'. ` )
        }

        if( typeof deployer !== 'object' ) {
            messages.push( `Key 'deployer' is not type of 'object'.` )
        }

        return [ messages, comments ]
    }


    validateCredential( { filePath, encrypt } ) {
        const messages = []
        const comments = []

        let msg = ''
        let json
        try {
            msg = `FilePath '${filePath}' could not load file`
            const txt = fs.readFileSync( filePath, 'utf-8' )
            msg = `FilePath '${filePath}' is not parsable.`
            json = JSON.parse( txt )
        } catch( e ) {
            console.log( e )
            messages.push( msg )
        }

        if( messages.length === 0 ) {
            json = encrypt.decryptCredential( {
                'credential': json
            } )

            const tests = this.#config['validate']['files']['contract']['keys']
                .map( a => {
                    const { name, key, validation, type } = a 
                    const value = keyPathToValue( { 'data': json, 'keyPath': key } )
                    const regex = keyPathToValue( { 'data': this.#config, 'keyPath': validation } )

                    let test = null
                    switch( type ) {
                        case 'string':
                            if( typeof value === undefined ) {
                                test = false
                                messages.push(`FilePath '${filePath}', key '${name}' is 'undefined'.` )
                            } else if( typeof value !== 'string' ) {
                                test = false
                                messages.push( `FilePath '${filePath}', key '${name}' is type of 'string'.` )
                            } else if( !regex['regex'].test( `${value}` ) ) {
                                test = false
                                messages.push( `FilePath '${filePath}', key '${name}' is not a valid pattern. ${regex['description']}` )
                            } else {
                                test = true
                            }
                            break
                        case 'array':
                            if( !Array.isArray( value ) ) {
                                messages.push( `FilePath '${filePath}', key '${name}' is type of 'array'.` )
                                test = false
                            } else {
                                test = value
                                    .map( v =>  regex['regex'].test( v ) )
                                    .every( a => a )

                                if( !test ) {
                                    messages.push( `FilePath '${filePath}', key '${name}' is not a valid pattern. ${regex['description']}` )
                                }
                            } 
                            break
                        default:
                            console.log( `Unknown Type: ${type}.` )
                            break
                    }

                    return test
                } )
                .every( a => a )

            if( !tests && messages.length === 0 ) {
                messages.push( `Credential raised an error.` )
            }

            const publicKey = PrivateKey
                .fromBase58( json['body']['account']['privateKey'] )
                .toPublicKey()
                .toBase58()

            const tests2 = [
                [
                    publicKey,
                    json['body']['account']['publicKey']
                ],
                [
                    shortenAddress( { publicKey } ),
                    json['header']['addressShort']
                ],
                [
                    this.#config['networks'][ json['header']['networkName'] ]['explorer']['wallet']
                        .replace( `{{publicKey}}`, publicKey ),
                    json['header']['explorer']
                ]
            ]
                .map( a => a[ 0 ] === a[ 1 ] )
                .every( a => a )

            if( !tests2 ) {
                messages.push( `PrivateKey from bodies privateKey differs from header publickey.` )
            }
        }

        return [ messages, comments ]
    }
}