export const config = {
    'server': {
        'port': 3001
    },
    'secret': {
        'fileName': '_.txt',
        'key': 'EASYMINA'
    },
    'validate': {
        'folders': {
            'credentials': {
                'name': '.mina',
                'subfolders': {
                    'accounts': {
                        'name': 'accounts'
                    },
                    'contracts': {
                        'name': 'contracts'
                    }
                }
            },
            'workdir': {
                'name': 'workdir',
                'subfolders': {
                    'name': null,
                    'default': 'hello-world',
                    'subfolders': {
                        'backend': {
                            'name': 'backend'
                        },
                        'frontend': {
                            'name': 'frontend'
                        }
                    }
                }
            }
        }, 
        'files': {
            'account': {
                'type': 'json',
                'keys': [
                    {
                        'name': 'name',
                        'key': 'header__name',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'groups',
                        'key': 'header__groups',
                        'validation': 'validate__values__string',
                        'type': 'array'
                    },
                    {
                        'name': 'publicKey',
                        'key': 'body__account__publicKey',
                        'validation': 'validate__values__minaPublicKey',
                        'type': 'string'
                    },
                    {
                        'name': 'privateKey',
                        'key': 'body__account__privateKey',
                        'validation': 'validate__values__minaPrivateKey',
                        'type': 'string'
                    }
                ]
            }
        },
        'values': {   
            'string': {
                'regex': /[a-zA-Z]+/,
                'description': 'Only string are allowed.'
            },
            'stringsAndDash': {
                'regex': /^[a-zA-Z]+(-[a-zA-Z]+)*$/,
                'description': "Only strings and hyphens are allowed, but hyphens should only appear in the middle."
            },
            'minaPublicKey': {
                'regex': /^B62[a-km-zA-HJ-NP-Z1-9]{52}$/,
                'description': "Allowed is a valid Mina public key format (starting with 'B62' followed by 52 alphanumeric characters)."
            },
            'minaPrivateKey': {
                'regex': /^EK[a-zA-Z0-9]+/,
                'description': "Allowed is a valid Mina private key format (starting with 'EK' followed by alphanumeric characters)."
            }
        }
    },
    'accounts': {
        'maxTries': 10000,
        'personas': {
            'alice': {
                'pattern': 'a'
            },
            'bob': {
                'pattern': 'b'
            },
            'chris': {
                'pattern': 'c'
            },
            'easyMina': {
                'pattern': 'z'
            }
        },
        'address': {
            'logic': {
                'and': [
                    {
                        'value': '0',
                        'description': 'Search for a given character.',
                        'method': 'inSuccession',
                        'option':  'endsWith', // 'inBetween', // 'endsWith',
                        'expect': {
                            'logic': '>=',
                            'value': 2
                        }
                    }
                ]
            }
        }
    },
    'networks': {
        'berkeley': {
            'explorer': {
                'wallet': 'https://berkeley.minaexplorer.com/wallet/{{publicKey}}',
                'transaction': 'https://berkeley.minaexplorer.com/transaction/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'berkeley-qanet'
            }
        },
        'testworld2': {
            'explorer': {
                'wallet': 'https://minascan.io/testworld/account/{{publicKey}}',
                'transaction': 'https://minascan.io/testworld/tx/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'itn-qanet'
            }
        },
        'devnet': {
            'explorer': {
                'wallet': 'https://devnet.minaexplorer.com/wallet/{{publicKey}}',
                'transaction': 'https://devnet.minaexplorer.com/transaction/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'devnet'
            }
        }
    }
}