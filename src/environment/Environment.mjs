import fs from 'fs'


export class Environment {
    #config

    constructor( config ) {
        this.#config = config
    }


    validate() {
        this.createCredentialsFolder()
        const [ m, c ] = this.#validateCredentialsFolder()
        const [ mm, cc ] = this.#validateWorDirFolder()

        return [ m, c ]
    }


    createCredentialsFolder() {
        const credentials = this.#config['validate']['folders']['credentials']
        const paths = Object
            .entries( credentials['subfolders'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                if( index === 0 ) { 
                    acc.push( credentials['name'] )
                }
                let path = ''
                path += credentials['name'] + '/'
                path += value['name']
                acc.push( path )
                return acc
            }, [] ) 
            .forEach( path => {
                if( !fs.existsSync( path ) ) {
                    fs.mkdirSync( path )
                }
            } )

        return true
    }


    #validateCredentialsFolder() {
        const messages = []
        const comments = []

        const credentials = this.#config['validate']['folders']['credentials']
        if( !fs.existsSync( credentials['name'] ) ) {
            messages.push( `Credentials folder '${credentials['name']}' is missing.` )
        }

        if( messages.length === 0 ) {
            Object
                .entries( credentials['subfolders'] )
                .forEach( a => {
                    const [ key, value ] = a
                    let path = ''
                    path += credentials['name'] + '/'
                    path += value['name']
                    if( !fs.existsSync( path ) ) {
                        messages.push( `Credentials subfolder '${path}' is missing.` )
                    }
                } )
        }

        return [ messages, comments ]
    }


    #validateWorDirFolder() {
        const messages = []
        const comments = []

        const workdir = this.#config['validate']['folders']['workdir']
        if( !fs.existsSync( workdir['name'] ) ) {
            messages.push( `Work Directory folder '${workdir['name']}' is missing.` )
        }

        if( messages.length === 0 ) {
            const folders = fs.readdirSync( workdir['name'] )
            console.log( 'folders', folders )
        }

        return [ messages, comments ]
    }
}