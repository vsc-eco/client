import Axios from 'axios'
import DagCbor from 'ipld-dag-cbor'

export async function convertTxJws(args: {
    sig: string
    tx: string
  }) {
    const tx = Buffer.from(args.tx, 'base64url')
    const sigDecoded = DagCbor.util.deserialize(Buffer.from(args.sig, 'base64url')) as {
        __t: 'vsc-sig',
        sigs: [
            {
                alg: string
                kid: string
                sig: Buffer
            }
        ]
    }
  
    const cid = (await DagCbor.util.cid(tx))

    let jwsDagOutput = []
    for(const sigVal of sigDecoded.sigs) {
        jwsDagOutput.push({
            jws: {
              payload: Buffer.from(cid.bytes).toString('base64url'),
              signatures: [
                    {
                        protected: Buffer.from(JSON.stringify({
                            alg: sigVal.alg,
                            kid: [sigVal.kid, sigVal.kid.split(':')[2]].join('#')
                        })).toString('base64url'),
                        signature: sigVal.sig
                    }
              ],
                link: cid
            },
            linkedBlock: tx
        })
    }
    return jwsDagOutput
  }

  
export async function getNonce(keyGroup, api) {
    const {data} = await Axios.post(api, {
        query:`
            query SubmitTx($keyGroup: [String]!) {
                getAccountNonce(keyGroup: $keyGroup) {
                    nonce
                }
            }
        `,
        variables: {
            keyGroup 
        }
    })
    return data.data.getAccountNonce.nonce
}

