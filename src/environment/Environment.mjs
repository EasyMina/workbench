import fs from 'fs'
import { keyPathToValue } from './helpers/mixed.mjs'



export class Environment {
    #config
    #state


    constructor( config ) {
        this.#config = config
    }


    init( { accountGroup, projectName } ) {
        this.#state = {
            accountGroup,
            projectName
        }
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
        const state = {
            'credentials': this.getStateCredentials(),
            'workDir': this.getStateWorkDir()
        }
        
        console.log( state )
    }


    getStateCredentials() {
        const state = {
            'exists': null
        }

        const folder = this.#config['validate']['folders']['credentials']['name']
        state['exists'] = fs.existsSync( folder )

        const credentials = this.#config['validate']['folders']['credentials']

        state['folders'] = Object
            .entries( credentials['subfolders'] )
            .reduce( ( acc, a, index ) => {
                const [ subfolder, values ] = a
                const struct = {
                    'exists': null,
                    'files': []
                }

                let path = ''
                path += folder + '/'
                path += subfolder
                struct['exists'] = fs.existsSync( path )
                acc[ subfolder ] = struct

                const files = fs.readdirSync( path )
                    .map( file => {
                        const filePath = `${path}/${file}`
                        if( !fs.statSync( filePath ).isDirectory() ) {
                            console.log( 'file', filePath )
                            if( filePath.endsWith( '.json' ) ) {
                                console.log( 'here', filePath ) 
                                this.#getAccount( { filePath } )
                            }
                        }
                    } )

                return acc
            }, {} )

process.exit( 1 )
        // console.log( '>>>', state )
        return state
    }


    getStateWorkDir() {
        const state = {
            'exists': null,
            'projects': {}
        }

        const folder = this.#config['validate']['folders']['workdir']['name']
        state['exists'] = fs.existsSync( folder )

        if( state['exists'] ) {
            state['projects'] = this.#getSubGroups()
                .reduce( ( abb, a, index ) => {

                    const struct = {
                        'default': null,
                        'folders': [],
                        'valid': null
                    }

                    struct['default'] = a['default']
                    // struct['default'] = a['default']
                    struct['folders'] = Object
                        .entries( this.#config['validate']['folders']['workdir']['subfolders']['subfolders'] )
                        .reduce( ( acc, b, rindex ) => {
                            const [ key, value ] = b
                            const path = [
                                this.#config['validate']['folders']['workdir']['name'],
                                a['folder'],
                                value['name']
                            ]
                                .join( '/' )
                            acc[ key ] = {
                                path,
                                'exists': fs.existsSync( path )
                            }
                            return acc
                        }, {} )

                    abb[ a['folder'] ] = struct

/*
                    struct['complete'] = Object
                        .values( struct['subfolders'] )
                        .every( ( a ) => a['exists'] )
*/
                   //
                    return abb
                }, {} )
        }
 
        return state
    }


    #getAccount( { filePath } ) {
        const state = {}
        try {
            const txt = fs.readFileSync( filePath, 'utf-8' )
            const json = JSON.parse( txt )

            const validations = this.#config['validate']['files']['account']['keys']
                .map( a => {
                    const { key, validation, type } = a 
                    keyPathToValue( { 'data': '' })

                } )

            console.log( 'v', validations )

        } catch( e ) {
            console.log( 'e', e )
        }

        return true
    }

    #getSubGroups() {
        const workdir = this.#config['validate']['folders']['workdir']
        const subgroups = fs.readdirSync( workdir['name'] )
            .filter(item => {
                const path = [ workdir['name'], item ]
                    .join( '/' )
                return fs.statSync( path ).isDirectory()
            } )
            .map( a => {
                const struct = {
                    'folder': a,
                    'default': a === workdir['subfolders']['default']
                }

                return struct
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