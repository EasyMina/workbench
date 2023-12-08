import fs from 'fs'


export class Environment {
    #config
    #state


    constructor( config ) {
        this.#config = config
    }


    create() {
        const state = this.getState()
        const tmp = [ 'credentials', 'workdir' ]
            .forEach( key => {
                const path = this.#config['validate']['folders'][ key ]['name']
                !state[ key ] ? fs.mkdirSync( path ) : ''
            } )

        state['subgroups']
            .forEach( item => {
                Object
                    .entries( item['subfolders'] )
                    .forEach( a => {
                        const [ key, value ] = a
                        if( !value['exists'] ) {
                            fs.mkdirSync( value['path'], { 'recursive': true } )
                        }
                    } )
            } )

        return true
    }


    getState() {
        const state = [ 'credentials', 'workdir' ]
            .reduce( ( acc, key, index ) => {
                const folder = this.#config['validate']['folders'][ key ]['name']
                acc[ key ] = fs.existsSync( folder ) ? true : false
                return acc
            }, {} )

        state['subgroups'] = []
        const subGroups = this.#getSubGroups()
        const _default = subGroups
            .some( a => a['default'] )

        if( !_default ) {
            const name = this.#config['validate']['folders']['workdir']['subfolders']['default']
            subGroups.push( name )
        }

        if( state['workdir'] ) {
            state['subgroups'] = subGroups
                .map( ( folder, index ) => {
                    const struct = {
                        'default': null,
                        'subfolders': [],
                        'valid': null
                    }

                    struct['default'] = ( struct['default'] === this.#config['validate']['folders']['workdir']['subfolders']['default'] )
                    struct['subfolders'] = Object
                        .entries( this.#config['validate']['folders']['workdir']['subfolders']['subfolders'] )
                        .reduce( ( acc, b, rindex ) => {
                            const [ key, value ] = b
                            const path = [
                                this.#config['validate']['folders']['workdir']['name'],
                                folder,
                                value['name']
                            ]
                                .join( '/' )
                            acc[ key ] = {
                                path,
                                'exists': fs.existsSync( path )
                            }
                            return acc
                        }, {} )

                    struct['complete'] = Object
                        .values( struct['subfolders'] )
                        .every( ( a ) => a['exists'] )
                    
                    return struct 
                } )
        }

        return state
    }


    #getSubGroups() {
        const workdir = this.#config['validate']['folders']['workdir']
        const subgroups = fs.readdirSync( workdir['name'] )
            .filter(item => {
                const path = [ workdir['name'], item ]
                    .join( '/' )
                return fs.statSync( path ).isDirectory()
            } )

        return subgroups
    }
/*
    validate() {
        this.createCredentialsFolder()
        this.createWorkdirFolder( { 
            'projectName': this.#config['validate']['folders']['workdir']['subfolders']['default']
        } )
        const [ m, c ] = this.#validateCredentialsFolder()
        const [ mm, cc ] = this.#validateWorDirFolder()


        return [ [ ...m, ...mm ] , [ ...c, ...cc ] ]
    }


    getSubGroups() {
        const workdir = this.#config['validate']['folders']['workdir']
        const subgroups = fs.readdirSync( workdir['name'] )
            .filter( a => this.#config['validate']['values']['stringsAndDash']['regex'].test( a ) )
        return subgroups
    }


    createWorkdirFolder( { projectName } ) {
        const workdir = this.#config['validate']['folders']['workdir']
        if( !fs.existsSync( workdir['name'] ) ) {
            fs.mkdirSync( workdir['name'] )
        }

        const subgroups = this.getSubGroups()
        if( !subgroups.includes( projectName ) ) {
            Object
                .entries( workdir['subfolders']['subfolders'] )
                .forEach( a => {
                    const [ key, value ] = a

                    let path = [
                        workdir['name'],
                        projectName,
                        value['name']
                    ]
                        .join( '/' )
                    
                    if( !fs.existsSync( path ) ) {
                        fs.mkdirSync( path, { 'recursive': true } )
                    }
                } )
        }

        return true
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
            const subgroups = this.getSubGroups()
            if( subgroups.length === 0 ) {
                messages.push( `Work Directory '${workdir['name']}' no project found.` )
            }

            subgroups
                .forEach( subgroup => {
                    Object
                        .entries( workdir['subfolders']['subfolders'] )
                        .forEach( a => {
                            const [ key, value ] = a

                            let path = [
                                workdir['name'],
                                subgroup,
                                value['name']
                            ]
                                .join( '/' )

                            if( !fs.existsSync( path ) ) {
                                messages.push( `Work Directory subfolder '${path}' is missing.` )
                            }

                        } )
                })
        }

        return [ messages, comments ]
    }

*/
}