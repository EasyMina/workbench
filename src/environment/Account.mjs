import { PatternFinder } from 'patternfinder'
import { keyPathToValue, shortenAddress } from './../helpers/mixed.mjs'

import { PrivateKey } from 'o1js'
import axios from 'axios'
import fs from 'fs'
import moment from 'moment'


export class Account {
    #config
    #patternFinder


    constructor( { accounts, networks, validate } ) {
        this.#config = { accounts, networks, validate }
        this.#patternFinder = this.#addPatternFinder()

        return true
    }


    async create( { name, groupName, pattern=true, networkName, encrypt, id } ) {
        const deployer = this.#createAddress( { name, pattern } )

        const faucet = await this.#sendFaucet( { 
            'publicKey': deployer['publicKey'],
            networkName
        } )

        const struct = {
            'header': {
                name,
                groupName,
                'environmentId': id,
                networkName,
                'addressShort': null,
                'addressFull': null,
                'explorer': null,
                'created': null,
                'faucetTxHash': null,
                'faucetTxHashExplorer': null,
                encrypt
            },
            'body': {
                'account': {
                    'publicKey': null,
                    'privateKey': null
                },
                'faucet': faucet
            },
            'disclaimer': null
        }

        struct['header']['created'] = moment().format( 'YYYY-MM-DD hh:mm:ss A' )

        struct['header']['addressShort'] = `${deployer['publicKey'].slice( 0, 8 )}...${deployer['publicKey'].slice( -4 )}`
        struct['header']['addressFull'] = deployer['publicKey']
        struct['header']['explorer'] = this.#config['networks'][ networkName ]['explorer']['wallet']
            .replace( '{{publicKey}}', deployer['publicKey'] )

        struct['header']['faucetTxHash'] = faucet['status']['paymentID']
        struct['header']['faucetTxHashExplorer'] = this.#config['networks'][ networkName ]['explorer']['transaction']
            .replace( '{{txHash}}', struct['header']['faucetTxHash'] )

        struct['body']['account']['publicKey'] = deployer['publicKey']
        struct['body']['account']['privateKey'] = deployer['privateKey']

        struct['disclaimer'] = this.#config['accounts']['disclaimer']
        return struct
    }


    validate( { filePath, encrypt } ) {
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


    #createAddress( { name, pattern=true } ) {
        let user, presetKey


        const search = name
            .substring( 0, 1 )
            .toLowerCase()

        if( this.#patternFinder.getPresetKeys().includes( search ) ) {
            presetKey = search
        } else {
            presetKey = 'other'
        }

        if( !pattern ) {
            user = this.#getKeyPairs()
        } else {
            let loop = true
            let index = 0

            process.stdout.write( `  ${name}  `)
            while( loop ) {
                index % 1000 === 0 ? process.stdout.write( `.` ) : ''
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
            console.log( '' )
        } 

        return user
    }


    async #sendFaucet( { publicKey, networkName } ) {
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
        const patternFinder = new PatternFinder( false )

        this.#config['accounts']['personas']['chars']
            .reduce( ( acc, a, index, all ) => {
                acc.push( { 'key': a, 'value': a } )
                if( all.length - 1 === index ) {
                    acc.push( { 
                        'key': 'other', 
                        'value': this.#config['accounts']['personas']['other'] 
                    } )
                }
                return acc
            }, [] )
            .forEach( a => {
                const { key, value } = a
                const challenge = JSON.parse( 
                    JSON.stringify( this.#config['accounts']['pattern'] )
                )
    
                challenge['logic']['and'][ 0 ]['value'] = value
                patternFinder.setPreset( {
                    'presetKey': key,
                    'challenge': challenge
                } ) 
            } )

        return patternFinder
    }
}