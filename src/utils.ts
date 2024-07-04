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


/**
 * Converts Number to uint256 or other type where applicable
 * @param type 
 * @returns 
 */
function eip712Type(type: string) { 
    if(type === 'number') { 
        return 'uint256'
    } else {
        return type
    }
}

function convertJsTypeToTypedData(a: Object, prefix?: string) {
    const types = []
    const values = []
    if(typeof a === 'object') {

        for(let key in a) {
            const value = a[key]
            
            console.log(typeof value, 'object')
            if(typeof value === 'object') {
                if(Array.isArray(value)) { 
                  values.push({
                      name: key,
                      //Check first element and determine if array
                      type: `${eip712Type(typeof value[0])}[]`
                  })
                } else {
                  const {values: returnedValues, types: returnedTypes} = convertJsTypeToTypedData(value, `${prefix}.${key}`)
                  
                  console.log(prefix, key, values, types)
                  //Push subtypes
                  types.push(...returnedTypes)
                  //Push self type
                  types.push({
                    name: `${prefix}.${key}`,
                    definition: returnedValues
                  })
                  values.push({
                    name: key,
                    type: `${prefix}.${key}`
                  })
                }
            } else {
                values.push({
                    name: key,
                    type: eip712Type(typeof value)
                })
            }
        }

        return {
          values: values,
          types: types
        }
    } else {
        return {
          values: [
            {
              name: prefix,
              type: eip712Type(typeof a)
            }
          ]
        }
    }
}

export function convertEIP712Type(a: any, type: string = 'tx_container_v0') {
  const typedDataPartial = convertJsTypeToTypedData(a, type)

  let obj = {}
  for(let value of typedDataPartial.types) {
    obj[value.name] = value.definition
  }

  const out =  {
      EIP712Domain: [
        { name: "name", type: "string" },
      ],
      types: {
        ...obj,
        [type]: typedDataPartial.values
      },
      primaryType: type,
      message: a,
      domain: {
        name: "vsc.network"
      }
  }
  return out
}

