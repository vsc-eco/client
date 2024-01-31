import { DID } from "dids";
import {Client as HiveClient} from '@hiveio/dhive'
import { KeychainSDK } from "keychain-sdk";
import { encodePayload } from 'dag-jose-utils'
import Axios from "axios";

let hiveClient = new HiveClient('https://api.hive.blog')


export function setHiveAPI(api: string | string[]) {
  hiveClient = new HiveClient(api)
}

/**
 * Future work: Tx builder, easily craft highly complicated transactions
 */
class TxBuilder {

}

export class vTransaction {
  signature: object | null
  txData: object | null
  constructor() {
    this.txData = null;
  }


  async setTx(txData) {
    this.txData = txData
  }

  async sign(did: DID) {

  }
  
  async broadcast(client: vClient) {
    if(!this.txData) {
      throw new Error('No TX specified!')
    }
    if(client._args.loginType === 'hive') {

    } else if(client._args.loginType === 'offchain') {
      //Create JWS signed by DID
      const jws = await client._did.createDagJWS(this.txData)
      
      //Convert JWS into separate sig & tx data
      const protectedVal = JSON.parse(Buffer.from(jws.jws.signatures[0].protected,'base64url').toString())
      const did = protectedVal.kid.split('#')[0]
     
      const sigs = [
        {
          alg: protectedVal.alg,
          //Key id copy
          kid: did,
          sig: jws.jws.signatures[0].signature
        }
      ]
      const sigEncoded = Buffer.from((await encodePayload({
        __v: 'vsc-sig',
        sigs
      })).linkedBlock).toString('base64url')
      // const encodedTx = Buffer.from(jws.linkedBlock).toString('base64url');

      // const convertJws = await convertTxJws({
      //   sig: sigEncoded,
      //   tx: encodedTx
      // });

      // const verifResult = await client._did.verifyJWS(convertJws.jws as any)
      // const {data} = await Axios.post(`${client._args.api}/api/v0/graphql`, {
      //   query: '',
      //   variables: {
      //     sig: sigEncoded
      //   }
      // })
      // const submitResult = data.data;
    }
  }
}

export interface vClientArgs {
  /**
   * Decide whether the VSC client should interact with hive on chain or offchain data.
   */
  loginType: 'hive' | 'offchain'

  /**
   * VSC API 
   */
  api: string
}

export class vClient {
  loggedIn: boolean
  _args: vClientArgs;
  _did: DID;
  secrets: {
    posting?: string
    active?: string
  }
  _keychain: KeychainSDK;
  hiveName: string;

  constructor(args: vClientArgs) {
    this.loggedIn = false;
    this._args = args;

    this.secrets = {

    }
  }

  async call() {

  }

  async login(did: DID) {
    if(this._args.loginType === 'hive') {
      throw new Error('args.loginType must be set to "offchain"')
    }
    if(!did.authenticated) {
      throw new Error('DID Not authenticated! Must run await did.authenticate()')
    }
    this._did = did;
  }

  async loginWithHive(args: {
    hiveName: string
    provider: 'hive_keychain' | 'direct'
    posting?: string
    active?: string
  }) {

    if(args.provider === 'hive_keychain') {
      if(!(window as any).hive_keychain) {
        throw new Error('Hive keychain not available')
      }
      this._keychain = new KeychainSDK(window);
      this.loggedIn = true
    } else if (args.provider === 'direct') {
      if(!args.posting || !args.active) {
        throw new Error('Missing posting or active key')
      }
      this.secrets.posting = args.posting
      this.secrets.active = args.active
      this.loggedIn = true
    } else {
      throw new Error('Invalid Provider')
    }
    this.hiveName = args.hiveName
  }
  
  async _sign() {

  }
}