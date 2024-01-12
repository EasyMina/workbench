import axios from 'axios'
import url from 'url'
import path from 'path'


export class Markdown {
    #config


    constructor( config ) {
        this.#config = config
    }


    createAccountGroupTables( { environment, account, encrypt } ) {
        const accounts = environment.getAccounts( { 
            account, 
            encrypt 
        } )

        let strs = ''

        strs += Object
            .entries( accounts )
            .reduce( ( acc, a, index ) => {
                const [ groupName, accountGroup ] = a
                acc += `### ${groupName}  \n`
                acc += "\n"
                acc += this.#createAccountGroupTable( {
                    groupName,
                    accountGroup
                } )
                acc += `  \n`
                acc += `  \n`

                return acc
            }, '' )


        return strs
    }


    createProjects( { environment } ) {
        const contractGroup = environment.getDevelopmentContracts()
        const scripts = environment.getScripts()

        let strs = ''
        strs += `  \n`
        strs += `  \n`
        strs += Object
            .entries( contractGroup )
            .reduce( ( acc, a, index ) => {
                const [ projectName, contracts ] = a
                acc += `<details close><summary>  \n`
                acc += `  \n`
                acc += `#### ${projectName}  \n`
                acc += `</summary>  \n`
                acc += `  \n`
                acc += this.#createProjectContractTable( { contracts, projectName } )
                acc += `  \n`
                acc += this.#createProjectBackendTable( { scripts, projectName, 'key': 'backend' } )
                acc += `  \n`
                acc += this.#createProjectBackendTable( { scripts, projectName, 'key': 'frontend' } )
                acc += `  \n`
                acc += `</details>  \n`
                return acc
            }, '' ) + '  '

        return strs
    }


    #createProjectBackendTable( { scripts, projectName, key } ) {
        let strs = ''

        const str = key
            .split( '' )
            .map( ( char, index ) => {
                if( index === 0 ) {
                    return char.charAt( 0 ).toUpperCase()
                } else {
                    return char.charAt( 0 ).toLowerCase()
                }
            } )
            .join( '' )


        
        const columns = [ 'Name', 'Source', 'Readme' ]
        const table = Object
            .entries( scripts[ projectName ][ key ] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                if( index === 0 ) {
                    strs += `**${str}**  \n`
                    strs += `  \n`
                    acc += `| ${columns.join( ' | ' )} |  \n`
                    acc += `| ${columns.map( a => `:--` ).join( ' | ' )} |  \n`
                }

                acc += `| `
                acc += `${key} |`
                acc += `[${path.basename( value['source'] )}](${value['source']}) |`
                acc += `${ value === '' ? '' : `[${value['md']}](${value['md']})`}  \n`

                return acc
            }, '')

        strs += table

        return strs
    }


    #createProjectContractTable( { contracts, projectName } ) {
        let strs = ''
        // strs += `#### ${projectName}  \n`
        const columns = [ 'Name', 'Methods', 'Typescript', 'Javascript' ]
        const tables = Object
            .entries( contracts )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a 
                if( index === 0 ) {
                    strs += `**Contracts**  \n`
                    strs += `  \n`
                    acc += `| ${columns.join( ' | ' )} |  \n`
                    acc += `| ${columns.map( a => `:--` ).join( ` | ` )} |  \n`
                }

                acc += `| `
                acc += [
                    [ `${key}`, 'name' ],
                    [ ``, 'methods' ],
                    [ `${value['ts']}`, 'file' ],
                    [ `${value['js']}`, 'file' ],
                    // [ `${JSON.stringify({'name': key, 'groupName': projectName })}`, 'import' ]
                ]
                    .map( a => {
                        const [ value, type ] = a
                        let str = ''
                        switch( type ) {
                            case 'name':
                                str = `${value}`
                                break
                            case 'methods':
                                str = ``
                                break
                            case 'file':
                                if( value === '' ) {
                                    str = ``
                                } else {
                                    str = `[file](${value})`
                                }
                                break
                            case 'import':
                                // str = `\`${value}\``
                                break
                            default:
                                break
                        }

                        return str
                    } )
                    .join( ` | ` )
                acc += ` |  \n`

                return acc
            }, '')

        strs += tables + "  \n"
        strs += `Run typescript compile with: \`tsc -p '...'\`  \n`

        return strs
    }


    #createAccountGroupTable( { groupName, accountGroup } ) {
        const columns = [ 'Name', 'Address', 'Balance', 'Nonce', 'Explorer' ]

        let strs = ''
        strs += Object
            .entries( accountGroup )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                if( index === 0 ) {
                    acc += `| ${columns.join( ' | ')} |  \n`
                    acc += `| ${columns.map( a => ':--' ).join( ' | ')} |  \n`
                }

                acc += `| `
                acc += columns
                    .map( column => {
                        let str = ''
                        switch( column ) {
                            case 'Name':
                                str = value['name']
                                break
                            case 'Address':
                                str = value['addressShort']
                                break
                            case 'Balance': 
                                str = ''
                                break
                            case 'Nonce': 
                                str = ''
                                break
                            case 'Explorer':
                                const parsedUrl = url.parse( value['explorer'] )
                                let hostname = parsedUrl.hostname
                                if( hostname.split( '.' ).length > 2 ) {
                                    hostname = hostname.split( '.' ).slice( -2 ).join( '.' )
                                }

                                str += `[`
                                str += `${hostname} `
                                str += `(${value['networkName']})`
                                str += `]`
                                str += `(${value['explorer']})`
                                break
                            case 'Import':
                                // str = ` \`${JSON.stringify( { name: value['name'], groupName } )}\` `
                                break
                            default:
                                break
                        }

                        return str
                    } )
                    .join( ' | ' )

                acc += ` |  \n`
                return acc
            }, '' )
            
        return strs
    }
}