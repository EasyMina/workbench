import fs from 'fs'
import { keyPathToValue } from './../helpers/mixed.mjs'


export class Environment {
    #config
    #state


    constructor( validate ) {
        this.#config = validate
        return true
    }


    init( { accountGroup, projectName } ) {
        this.#state = {
            accountGroup,
            projectName
        }
    }

/*
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
*/

    getState( { account } ) {
        const state = {
            'credentials': this.#getStateCredentials( { account } ),
            'workDir': this.#getStateWorkDir()
        }
        
        return state
    }


    updateCredentials( { state } ) {
        const tmp = [
            [ 
                'credentials__exists',  
                [ 'validate__folders__credentials__name' ]
            ],
            [ 
                'credentials__folders__account__exists', 
                [ 
                    'validate__folders__credentials__name',
                    'validate__folders__credentials__subfolders__accounts__name' 
                ]
            ],
            [ 
                'credentials__folders__contract__exists', 
                [
                    'validate__folders__credentials__name',
                    'validate__folders__credentials__subfolders__contracts__name' 
                ]
                
            ]
        ]
            .forEach( cmd => {
                const exists = keyPathToValue( { 'data': state, 'keyPath': cmd[ 0 ] } )
                if( !exists ) {
                    const path = cmd[ 1 ]
                        .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )
                        .join( '/' )
                    fs.mkdir( path )
                }
            } )

        return true
    }



    #getStateCredentials( { account } ) {
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
                    'groups': []
                }

                let path = ''
                path += folder + '/'
                path += subfolder
                struct['exists'] = fs.existsSync( path )
                acc[ subfolder ] = struct
console.log( 'struct', struct )
                struct['groups'] = fs.readdirSync( path )
                    .reduce( ( abb, file, index ) => {
                        const filePath = `${path}/${file}`
                        if( !fs.statSync( filePath ).isDirectory() ) {
                            if( filePath.endsWith( '.json' ) ) {
                                const validate = account
                                    .validateDeployer( { filePath } )
                                if( validate[ 0 ].length === 0 ) {
                                    const tmp = fs.readFileSync( filePath, 'utf-8' )
                                    const json = JSON.parse( tmp )

                                    const struct = {
                                        filePath, 
                                        'name': json['header']['name'],
                                        'groups': json['header']['groups']
                                    }

                                    abb.push( struct )
                                }
                            }
                        }
                        return abb
                    }, [] )
                    .reduce( ( abb, item, index ) => {
                        item['groups']
                            .forEach( group => {
                                abb[ group ] = {
                                    'name': item['name'],
                                    'filePath': item['filePath']
                                }
                            } )
                        return abb
                    }, {} )

                return acc
            }, {} )

        return state
    }


    #getStateWorkDir() {
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

                    return abb
                }, {} )
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