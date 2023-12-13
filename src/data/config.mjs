export const config = {
    'validate': {
        'folders': {
            'credentials': {
                'name': '.mina',
                'subfolders': {
                    'accounts': {
                        'name': 'accounts'
                    },
                    'contract': {
                        'name': 'contract'
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
                        'fontend': {
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
                        'key': 'header__name',
                        'validation': 'validation__values__string',
                        'type': 'string'
                    },
                    {
                        'key': 'header__groups',
                        'validation': 'validation__values__string',
                        'type': 'array'
                    },
                    {
                        'key': 'body__address__publicKey',
                        'validation': 'validation__values__minaPublicKey',
                        'type': 'string'
                    },
                    {
                        'key': 'body__address__privateKey',
                        'validation': 'validation__values__minaPrivateKey',
                        'type': 'string'
                    }
                ]
            }
        },
        'values': {        
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