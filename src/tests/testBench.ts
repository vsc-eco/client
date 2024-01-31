import Crypto from 'crypto'
import { Ed25519Provider } from "key-did-provider-ed25519";
import { DID } from "dids";
import KeyResolver from 'key-did-resolver'
import { encodePayload } from 'dag-jose-utils'
import Axios from 'axios'
import {vClient, vTransaction} from '..'

void (async () => {
    const client = new vClient({
        api: 'http://127.0.0.1:1337',
        loginType: 'offchain'
    })
    const secret = Buffer.from('44ab29dc82f227322cb924cdc66815da8edc9cb0b409f5ced26ced57e6077aa6', 'hex')
    const keyPrivate = new Ed25519Provider(secret)
    const did = new DID({ provider: keyPrivate, resolver: KeyResolver.getResolver() })
    await did.authenticate()
    
    await client.login(did)
    const tx = new vTransaction()
    tx.setTx({
        __t: 'vsc-tx',
        __v: '0.2',
        headers: {
            payer: 'hello world',
            lock_block: 81_999_000,
            required_auths: [
                'did:key:z6MkmzUVuC9rdXtDgrfUDRJqBZKUAwpAy3k1dDscsmvK5ftb'
            ],
            //Tuple of transaction intent enum and arguments as querystring
            intents: [
                ['money.spend', '']
            ],
        },
        tx: { 
            op: 'contract_mint',
            payload: {
                amount: '100T',
                to: 'did:key:z6MkmzUVuC9rdXtDgrfUDRJqBZKUAwpAy3k1dDscsmvK5ftb'
            },
            type: 'input'
        }
    })
    await tx.broadcast(client);

    
})()