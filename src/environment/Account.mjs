
import { PrivateKey } from 'o1js'
import { PatternFinder } from 'patternfinder'


export class Account {
    #config
    #patternFinder


    constructor( { accounts } ) {
        this.#config = { accounts }
        this.#patternFinder = this.addPatternFinder()

        return true
    }


    createAddress() {
        let loop = true
        let privateKey, publicKey

        let index = 0
        while( loop ) {
            index % 1000 === 0 ? process.stdout.write( `${index} ` ) : ''
            privateKey = PrivateKey
                .random()
                .toBase58()

            publicKey = PrivateKey
                .fromBase58( privateKey )
                .toPublicKey()
                .toBase58()

            const result = !this.#patternFinder
                .getResult( {
                    'str': publicKey,
                    'presetKey': 'alice',
                  //  'flattenResult': true
                } )
            console.log( result )
            loop = !result
            index++
        }

        console.log( 'found', publicKey )

/*
        for( let i = 0; i < 10; i++ ) {
            const privateKey = PrivateKey
                .random()
                .toBase58()

            const publicKey = PrivateKey
                .fromBase58( privateKey )
                .toPublicKey()
                .toBase58()

            const result = this.#patternFinder( {
                'str': publicKey,
                'presetKey': 'alice',
                'flattenResult': false
            } )
            console.log( 'pub', publicKey )
            console.log( 'pub', publicKey )
        }
*/
        return true
    }


    addPatternFinder() {
        const patternFinder = new PatternFinder()
        const challenge = JSON.parse( 
            JSON.stringify( this.#config['accounts']['address'] )
        )

        Object
            .entries( this.#config['accounts']['personas'] )
            .forEach( a => {
                const [ key, value ] = a
                console.log( '>>>', value['pattern'])
                challenge['logic']['and'][ 0 ]['value'] = value['pattern']
                patternFinder.setPreset( {
                    'presetKey': key,
                    'challenge': challenge
                } ) 
            } )

        return patternFinder
    }
}