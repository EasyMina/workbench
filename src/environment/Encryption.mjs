import crypto from 'crypto'
import { printMessages } from './../helpers/mixed.mjs'


export class Encryption {
    #config
    #secret


    constructor() {
        this.#config = { 
            'algorithm': 'aes-256-cbc',
            'secret': {
                'prefix': 'EA',
                'totalLength': 40,
                'charSet': 'abcdefghijklmnopqrstuvwxyzZ0123456789',
                'regex': /^EA(?=.*[a-z])(?=.*\d).{40,}$/,
                'description': 'Allowed are strings that begin with "EA" encompass at least one letter, include at least one digit, and have a length of at least 42 characters.'
            } 
        }

        return true
    }


    createSecret() {
        let str = null
        let tries = 0
        let loop = true
        while( loop ) {
            str = new Array( this.#config['secret']['totalLength'] )
                .fill( '' )
                .reduce( ( acc, a, index ) => {
                    const randomIndex = crypto.randomInt(
                        0, 
                        this.#config['secret']['charSet'].length
                    )
                    acc += this.#config['secret']['charSet']
                        .charAt( randomIndex )
                    return acc
                }, this.#config['secret']['prefix'] )
            const [ m, c ] = this.#validateSecret( { 'secret': str } )
            m.length === 0 ? loop = false : loop = true
            tries ++
        }

        return str
    }
    

    setSecret( { secret } ) {
        const [ messages, comments ] = this.#validateSecret( { secret } )
        printMessages( { messages, comments } )

        this.#secret = {
            'string': secret,
            'digest': null
        }

        const hash = crypto.createHash( 'sha256' )
        hash.update( this.#secret['string'] )
        this.#secret['digest'] = hash.digest()

        return this
    }


    encrypt( { text } ) {
        const [ messages, comments ] = this.#validateSecret( { 'secret': this.#secret['string'] } )
        printMessages( { messages, comments } )

        const iv = crypto.randomBytes( 16 )

        const cipher = crypto.createCipheriv( 
            this.#config['algorithm'], 
            this.#secret['digest'], 
            iv 
        )

        const encrypted = Buffer.concat( [ 
            cipher.update( `${text}` ), 
            cipher.final() 
        ] )

        const content = encrypted
            .toString( 'hex' )

        const result = {
            'iv': iv.toString('hex'),
            'content': content
        }
      
        return result
    }


    decrypt( { hash } ) {
        const [ messages, comments ] = this.#validateSecret( { 'secret': this.#secret['string'] } )
        printMessages( { messages, comments } )

        const decipher = crypto.createDecipheriv(
            this.#config['algorithm'], 
            this.#secret['digest'],
            Buffer.from( hash['iv'], 'hex' ) 
        )

        const decrypted = Buffer.concat( [
            decipher.update( Buffer.from( hash['content'], 'hex' ) ), 
            decipher.final()
        ] )
      
        return decrypted.toString()
    }


    encryptDeployer( { deployer } ) {
        const [ messages, comments ] = this.#validateSecret( { 'secret': this.#secret['string'] } )
        printMessages( { messages, comments } )

        deployer['body'] = this.encrypt( { 
            'text': JSON.stringify( deployer['body'] )
        } )

        return deployer
    }


    decryptDeployer( { deployer } ) {
        const [ messages, comments ] = this.#validateSecret( { 'secret': this.#secret['string'] } )
        printMessages( { messages, comments } )

        deployer['body'] = JSON.parse( 
            this.decrypt( { 'hash': deployer['body'] } ) 
        ) 
 
        return deployer
    }

/*
    #addSecret( { secret } ) {
        if ( typeof secret === 'string' || secret instanceof String ) {
            const str = this.#hashString( { 'string': secret } )
            this.#secret['digest'] = str

        } else {
            console.log( 'Secret is not a string.' )
            process.exit( 1 )
        }
    }


    #hashString( { string } ) {
        const hash = crypto.createHash( 'sha256' )
        hash.update( string )
        const bytes32 = hash.digest()

        return bytes32
    }
*/

    #validateSecret( { secret } ) {
        const messages = []
        const comments = []

        if( typeof secret !== 'string' ) {
            messages.push( `Secret is not type of string.` )
        } else {
            const test = this.#config['secret']['regex']
                .test( secret )
            if( !test ) {
                messages.push( `Secret has not a valid pattern. ${this.#config['secret']['description']}`)
            }
        }

        return [ messages, comments ]
    }
}