// import { Client, Account } from "appwrite";

// export const client = new Client();

// client
//   .setEndpoint("https://cloud.appwrite.io/v1")
//   .setProject(process.env.APPWRITE_PROJECT_ID);

// export const account = new Account(client);
// export const messaging = new Messaging(client)
// export { ID } from "appwrite";

import * as sdk from "node-appwrite";

const client = new sdk.Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("6689b618000901d7ff1a")
  .setKey(
    "4873487eaeaf3654dafc322fa1a9701ce1976295f7394037000801011b081b81b14199000baa9a364896cc197b75aa0d9d84cd786f421842ee138f929319200f484004bfc4f8e1b208e94f4ccaa598f3c8a41b30bcad272781ef077d5bcdd6efea69defc7af086884060d4f45be25936b7d7b05d8bfa998f6bd7db77721c91c4"
  );

export const account = new sdk.Account(client);
export const messaging = new sdk.Messaging(client);
export { ID } from "node-appwrite";
