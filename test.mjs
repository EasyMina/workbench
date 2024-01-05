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

console.log( test )


// B62qq2F7uoLmbqpyxmYPJaVbbDvs3j9rLGUryRKEyBdbkVYxWu8TCaa // funded
// B62qpBUTJ4hLUAYV8nbh9zo4eGiBDP9DtD7tGr9dJjdLgG2wBbe62Nr // contract


