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
                        'key': 'meta__name',
                        'validation': 'validation__values__string'
                    },
                    {
                        'key': 'data__address__public',
                        'validation': 'validation__values__minaPublicKey'
                    },
                    {
                        'key': 'data__address__private',
                        'validation': 'validation__values__minaPrivateKey'
                    }
                ]
            }
        },
        'values': {        
            'stringsAndDash': {
                'regex': /^[a-zA-Z-]+$/,
                'description': "Allowed are only strings and dashes for the 'stringsAndDash' validation."
            },
            'minaPublicKey': {
                'regex': /^B62[a-km-zA-HJ-NP-Z1-9]{52}$/,
                'description': "Allowed is a valid Mina public key format (starting with 'B62' followed by 52 alphanumeric characters) for the 'minaPublicKey' validation."
            },
            'minaPrivateKey': {
                'regex': /^EK[a-zA-Z0-9]+/,
                'description': "Allowed is a valid Mina private key format (starting with 'EK' followed by alphanumeric characters) for the 'minaPrivateKey' validation."
            }
        }
    },
    'accounts': {
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
    }
}