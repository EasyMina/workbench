import { MinaData } from 'minadata'

const minaData = new MinaData()
minaData.init( {} )

const test = await minaData.getData( { 
    'preset': 'accountBalance', 
    'userVars': {
        'publicKey': 'B62qreAk9MEEsQ7LFt5DkVFsJMp3eWZ5Ay8EGNJhWBMCDvLhMq9Ghaa'
    },
    'network': 'berkeley'
} )


const account = {
    'balance': null,
    'nonce': null
}

try {
    const tmp = [
        [ test['data']['account']['balance']['total'], 'balance' ],
        [ test['data']['account']['nonce'], 'nonce' ] 
    ]
        .forEach( a => {
            const [ value, key ] = a
            if( value !== undefined ) {
                account[ key ] = value
            }
        } ) 
} catch( e ) {}



console.log( JSON.stringify( test, null, 4 ) )

console.log( 'a', account )

// B62qq2F7uoLmbqpyxmYPJaVbbDvs3j9rLGUryRKEyBdbkVYxWu8TCaa // funded
// B62qpBUTJ4hLUAYV8nbh9zo4eGiBDP9DtD7tGr9dJjdLgG2wBbe62Nr // contract


