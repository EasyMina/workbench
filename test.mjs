const splits = [
    '',
    'Users',
    'andreasbanholzer',
    'PROJEKTE',
    '2023-10-19--easymina-v2',
    '2',
    '0-easymina-cli',
    'workdir',
    'hello-world',
    'contracts',
    'build',
    'Square.js'
]

const projectNames = [ 
    'ABC-Project', 
    'hello-world' 
]

const ttt = projectNames
    .reduce( ( acc, projectName, index ) => {
        const result = splits.find( a => ( a === projectName ) )
        console.log( '-', result )
        result !== undefined ? acc = result : ''
        return acc
    }, '' )

console.log( 'ttt', ttt )