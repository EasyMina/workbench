import axios from 'axios'
import url from 'url'


export class Markdown {
    #config


    constructor( config ) {
        this.#config = config
    }


    createAccountGroupTables( { accounts } ) {
        const accountGroup = accounts['new-berkeley']
        this.#createAccountGroupTable( {
            accountGroup
        } )

        let strs = ''

        strs += Object
            .entries( accounts )
            .reduce( ( acc, a, index ) => {
                const [ groupName, accountGroup ] = a

                acc += `#### ${groupName}  \n`
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


    createProjectTables( { contrtacts } ) {
        console.log( 'AAA', contrtacts )


        return true
    }


    #createProjectTable( { projectGroup } ) {
        return true
    }


    #createAccountGroupTable( { groupName, accountGroup } ) {
        const columns = [ 'Name', 'Address', 'Balance', 'Nonce', 'Explorer', 'Cmd' ]

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
                            case 'Cmd':
                                str = ` \`${JSON.stringify( { name: value['name'], groupName } )}\` `
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