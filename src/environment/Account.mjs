
import { PrivateKey } from 'o1js'
import { PatternFinder } from 'patternfinder'
import axios from 'axios'


export class Account {
    #config
    #patternFinder


    constructor( { accounts, networks } ) {
        this.#config = { accounts, networks }
        this.#patternFinder = this.#addPatternFinder()

        return true
    }


    async createDeployer( { name, pattern=true, networkNames=[ 'berkeley' ] } ) {
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

        return struct
    }


    #createAddress( { name, pattern=true } ) {
        let user

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
                        'presetKey': name,
                        'flattenResult': true
                    } )
                loop = !result
                index++
                if( index > this.#config['accounts']['maxTries'] ) {
                    loop = false
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
        const patternFinder = new PatternFinder()

        Object
            .entries( this.#config['accounts']['personas'] )
            .forEach( a => {
                const [ key, value ] = a
                const challenge = JSON.parse( 
                    JSON.stringify( this.#config['accounts']['address'] )
                )
// console.log( '>>>', value['pattern'] )
                challenge['logic']['and'][ 0 ]['value'] = value['pattern']
                patternFinder.setPreset( {
                    'presetKey': key,
                    'challenge': challenge
                } ) 
            } )

        return patternFinder
    }
}