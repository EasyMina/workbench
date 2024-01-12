import { printMessages, keyPathToValue } from '../helpers/mixed.mjs'
import fs from 'fs'
import path from 'path'
import moment from 'moment'


export class ProjectImporter {
    #config
    #templateStruct


    constructor( { validate, importer } ) {
        this.#config = { validate, importer }

        this.#templateStruct = {
            'projectName': '',
            'files': {
                'root': [],
                'contracts': [],
                'backend': [],
                'frontend': []
            }
        }

        return true
    }


    addProject( { projectName, type='external' } ) {
        switch( type ) {
            case 'external':
                break
            case 'internal':
                const path = `./import/templates/`
                break
            default:
                break
        }

        return true
    }


    #allFilesFromFolder( { folderPath } ) {
        function walkDir( currentPath ) {
          const files = fs
              .readdirSync( currentPath )
              .forEach( ( file ) => {
                  const filePath = path.join( currentPath, file )
                  if( fs.statSync( filePath ).isDirectory() ) {
                      walkDir( filePath )
                  } else {
                      fileList.push( filePath )
                  }
          } )
      
          return true
        }        

        let fileList = []
      
        walkDir( folderPath )
        return fileList
    }


    createImport( { importJson, projectName } ) {
        let root = ''
        root += this.#config['validate']['folders']['workdir']['name'] + '/'
        root += projectName

        Object
            .entries( importJson['folders'] )
            .forEach( a => {
                const [ key, values ] = a
                values
                    .forEach( item => {
                        const fullPath = `${root}/${item['destination']}`
                        const directoryPath = path.dirname( fullPath )
                        fs.mkdirSync( directoryPath, { 'recursive': true } )
                        fs.writeFileSync( 
                            fullPath,
                            item['content'],
                            'utf-8'
                        )
                    } )
            } )

        return true
    }


    createExport( { projectName } ) {
        const struct = this.#prepareExport()
        const { rootFolder, subfolders, suffixs } = struct
        const allFiles = this.#getExportFiles( { rootFolder, subfolders, suffixs } )

        const test = allFiles
            .map( a => a['projectName'] )
            .filter( ( v, i, a ) => a.indexOf( v ) === i )
            .includes( projectName )

        if( !test ) {
            console.log( `ProjectName '${projectName}' is not found.` )
            process.exit( 1 )
        }

        const structure = this.#getStructureFromFiles( { allFiles, subfolders } )
        const data = {
            'created': moment().format( 'YYYY-MM-DD hh:mm:ss A' ),
            projectName,
            ...structure[ projectName ]
        }

        return data
    }


    #prepareExport() {
        const result = {
            'rootFolder': null,
            'subfolders': null, 
            'suffixs': null
        }

        result['rootFolder'] = keyPathToValue( { 
            'data': this.#config, 
            'keyPath': this.#config['importer']['rootFolder']
        } )

        result['subfolders'] = this.#config['importer']['subfolders']
            .map( keyPath => keyPathToValue( { 'data': this.#config, keyPath } ) )

        result['suffixs'] = this.#config['importer']['suffixs']

        return result
    }


    #getExportFiles( { rootFolder, subfolders, suffixs } ) {
        function allFilesFromFolder( { rootFolder } ) {
            function walkDir( currentPath ) {
                const files = fs
                    .readdirSync( currentPath )
                    .forEach( ( file ) => {
                        const filePath = path.join( currentPath, file )
                        if( fs.statSync( filePath ).isDirectory() ) {
                            walkDir( filePath )
                        } else {
                            fileList.push( filePath )
                        }
                } )

                return true
            }

            let fileList = []
            walkDir( rootFolder )
            return fileList
        }


        const result = allFilesFromFolder( { rootFolder } )
            .map( filePath => {
                const split = filePath.split( '/' )
                const struct = {
                    'fileName': path.basename( filePath ),
                    'suffix': path.extname( filePath ),
                    'projectName': null,
                    'type': null,
                    'subfolderName': null,
                    'sourcePath': filePath,
                    'destinationPath': split.slice( 2 ).join( '/' ),
                    'rootPath': split.slice( 0, 2 ).join( '/' )
                }
        
                if( split.length > 1 ) {
                    struct['projectName'] = split[ 1 ]
                }
        
                if( split.length === 3 ) {
                    if( !fs.statSync( split.slice( 0, 3 ).join( '/' ) ).isDirectory() ) {
                        struct['type'] = 'root'
                    } else {
        
                    }
                } else if( split.length > 3 ) {
                    if( fs.statSync( split.slice( 0, 3 ).join( '/') ).isDirectory() ) {
                        struct['type'] = 'subfolder'
                        struct['subfolderName'] = split[ 2 ]
                    }
                }
        
                return struct
            } )
            .filter( a => a['type'] !== null )
            .filter( a => suffixs.includes( a['suffix'] ) )
            .filter( a => subfolders.includes( a['subfolderName'] ) || a['type'] === 'root' )
            .filter( a => {
                if( a['subfolder'] === 'contracts' ) {
                    if( a['filePath'].indexOf( 'contracts/build' ) !== -1 ) {
                        return false
                    } else {
                        return true
                    }
                }
                return true
            } )

        return result
    }


    #getStructureFromFiles( { allFiles, subfolders } ) {
        const result = allFiles
            .reduce( ( acc, a, index, all ) => {
                const struct = {
                    'destination': a['destinationPath'],
                    'content': fs.readFileSync( a['sourcePath'], 'utf-8' )
                }

                if( !Object.hasOwn( acc, a['projectName'] ) ) {
                    acc[ a['projectName'] ] = {
                        'rootPath': a['rootPath'],
                        'folders': {}
                    }
                    subfolders
                        .forEach( ( b, index ) => {
                            index === 0 ? acc[ a['projectName'] ]['folders']['root'] = [] : ''
                            acc[ a['projectName'] ]['folders'][ b ] = []
                        } )
                }

                if( a['type'] === 'root' ) {
                    acc[ a['projectName'] ]['folders']['root'].push( struct )
                } else if( a['type'] === 'subfolder' ) {
                    acc[ a['projectName'] ]['folders'][ a['subfolderName'] ].push( struct )
                } else {
                    console.log( 'Wrong type' )
                    process.exit( 1 )
                }
                return acc
            }, {} )

        return result
    }

}