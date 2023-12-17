import { PatternFinder } from 'patternfinder'
import { keyPathToValue } from './../helpers/mixed.mjs'

import { PrivateKey } from 'o1js'
import axios from 'axios'
import fs from 'fs'


export class Account {
    #config
    #patternFinder


    constructor( { accounts, networks, validate } ) {
        this.#config = { accounts, networks, validate }
        this.#patternFinder = this.#addPatternFinder()

        return true
    }


    async createDeployer( { name, groupName, pattern=true, networkNames=[ 'berkeley' ] } ) {
        const deployer = this.#createAddress( { name, pattern } )

        let faucets = await Promise
            .all(
                networkNames
                    .map( async( networkName ) => {
                        const faucet = await this.#sendFaucet( { 
                            'publicKey': deployer['publicKey'],
                            networkName
                        } )
                        return faucet
                    } )
            )

        faucets = faucets
            .reduce( ( acc, a, index ) => {
                acc[ a['networkName'] ] = a['status']
                return acc
            }, {} )
        
        const struct = {
            'header': {
                name,
                'groups': [ groupName ], 
                'explorer': null
            },
            'body': {
                'account': {
                    'publicKey': deployer['publicKey'],
                    'privateKey': deployer['privateKey']
                },
                'faucets': {
                    faucets
                }
            }
        }

        struct['header']['explorer'] = Object
            .entries( this.#config['networks'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                acc[ key ] = value['explorer']['wallet']
                    .replace( '{{publicKey}}', struct['body']['account']['publicKey'] )
                return acc
            }, {} )

        return struct
    }


    #createAddress( { name, pattern=true } ) {
        let user,presetKey

        if( this.#patternFinder.getPresetKeys().includes( name ) ) {
            presetKey = name
        } else {
            presetKey = 'easyMina'
        }

        if( !pattern ) {
            user = this.#getKeyPairs()
        } else {
            let loop = true
            let index = 0
            while( loop ) {
                index % 1000 === 0 ? process.stdout.write( `${index} ` ) : ''
                user = this.#getKeyPairs()
                const result = this.#patternFinder
                    .getResult( {
                        'str': user['publicKey'],
                        presetKey,
                        'flattenResult': true
                    } )
                loop = !result
                index++
                if( index > this.#config['accounts']['maxTries'] ) {
                    loop = false
                    user = this.#getKeyPairs()
                    // console.log( 'not found.' )
                }
            }
        } 

        return user
    }


    async #sendFaucet( { publicKey, networkName='berkeley' } ) {
        const url = this.#config['networks'][ networkName ]['faucet']['url']
        const network = this.#config['networks'][ networkName ]['faucet']['id']
        const address = publicKey

        let result = {
            networkName,
            'status': {
                'success': null,
                'paymentID': null,
                'explorer': null
            }
        }

        try {
            const body = { network, publicKey }
            const response = await axios.post(
                url, 
                { network, address }, 
                {
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    },
                    'maxBodyLength': Infinity
                }
            )
    
            // console.log( response.data )
            result['status']['paymentID'] = response['data']['message']['paymentID']
            result['status']['success'] = true
            result['status']['explorer'] = this.#config['networks'][ networkName ]['explorer']['transaction']
                .replace( '{{txHash}}', `${result['status']['paymentID']}` )

        } catch( e ) {
            // console.log( 'e', e )
            result['status']['success'] = false
        }

        return result
    }


    #getKeyPairs() {
        const privateKey = PrivateKey
            .random()
            .toBase58()

        const publicKey = PrivateKey
            .fromBase58( privateKey )
            .toPublicKey()
            .toBase58()

        return { privateKey, publicKey }
    }


    #addPatternFinder() {
        function setPreset( { key, value, config, patternFinder } ) {
            const challenge = JSON.parse( 
                JSON.stringify( config['accounts']['address'] )
            )

            challenge['logic']['and'][ 0 ]['value'] = value
            patternFinder.setPreset( {
                'presetKey': key,
                'challenge': challenge
            } ) 
        }

        const patternFinder = new PatternFinder( false )

        Object
            .entries( this.#config['accounts']['personas'] )
            .forEach( ( a, index, all ) => {
                const [ key, value ] = a
                setPreset( { 
                    key, 
                    'value': value['pattern'], 
                    'config': this.#config, 
                    patternFinder 
                } )
            } )

        return patternFinder
    }


    validateDeployer( { filePath } ) {
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
            const tests = this.#config['validate']['files']['account']['keys']
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
        }

        return [ messages, comments ]
    }
}