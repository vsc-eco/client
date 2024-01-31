import DagCbor from 'ipld-dag-cbor'

export async function convertTxJws(args: {
    sig: string
    tx: string
  }) {
    const tx = Buffer.from(args.tx, 'base64url')
    const sig = DagCbor.util.deserialize(Buffer.from(args.sig, 'base64url')) as {
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

    let jwsDag = {
        jws: {
          payload: Buffer.from(cid.bytes).toString('base64url'),
          signatures: [
                {
                    protected: Buffer.from(JSON.stringify({
                        alg: sig.sigs[0].alg,
                        kid: [sig.sigs[0].kid, sig.sigs[0].kid.split(':')[2]].join('#')
                    })).toString('base64url'),
                    signature: sig.sigs[0].sig
                }
          ],
            link: cid
        },
        linkedBlock: tx
    }
    return jwsDag
  }