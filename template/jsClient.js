/******************************************************************************
 *
 * Copyright (c) 2024 Oracle and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *****************************************************************************/

import { File } from '@asyncapi/generator-react-sdk';

function getDataProcessingBlock (msgType) {
  if (msgType === "array") {
    return ` 
        const recordArray = eval(records);
        for (var i = 0; i < recordArray.length; i++) {
	    console.log(recordArray[i]);
            //data processing, implement user logic here. 
        }
    `;
  }
  else {
    return ` 
        console.log(records);
        //data processing, implement user logic here. 
    `;	
  }
}

function getUserInputBlock (isSecure, authMethod) {

  let retStr = ``;

  if (isSecure) {
    retStr += ` 
    let userCert = "ASYNCAPI_WS_CLIENT_CERT" in process.env ? 
    		process.env.ASYNCAPI_WS_CLIENT_CERT : 
		reader.question("Enter location of the client certificate: ");
    let userKey = "ASYNCAPI_WS_CLIENT_KEY" in process.env ? 
    		process.env.ASYNCAPI_WS_CLIENT_KEY : 
		reader.question("Enter location of the private key: ");
    let caCert = "ASYNCAPI_WS_CA_CERT" in process.env ? 
    		process.env.ASYNCAPI_WS_CA_CERT : 
		reader.question("Enter location of the CA certificate: ");
    `;
  }
  else
  {
    if (authMethod === "certificate")
    {
      throw new Error('authorization using certificate is currently not supported for ws protocol, please set authorization as basic or digest');
    }
  }

  if (authMethod === "basic" || authMethod === "digest")
  {
    retStr += `
    let username = "ASYNCAPI_WS_CLIENT_USERNAME" in process.env ?
            process.env.ASYNCAPI_WS_CLIENT_USERNAME :
        reader.question("Enter the username for accessing the service: ");
    let password = "ASYNCAPI_WS_CLIENT_PASSWORD" in process.env ?
            process.env.ASYNCAPI_WS_CLIENT_PASSWORD :
        reader.question("Enter the password for accessing the service: ",{ hideEchoBack: true });
    if (!username || !password) {
      throw new Error("username and password can not be empty");
    }
      `;
  }

  return retStr;
}

function getQueryParamBlock(queryMap) {
  let mapSize = queryMap.length;  
  let s1 ='\n    const queryParams = new Map([';
  queryMap.forEach(function(value, key) {
    s1 += '[\''+key+'\',\''+value+'\']';
    mapSize--;
    if (mapSize) {
      s1+= ','
    }
  })
  s1+=']);';
    
  return s1+`\n
    const queryParamSign    = "?";
    const queryParamDelimit = "&";
    let queryParamSignAdded = false;
    let size                = queryParams.length;

    for (const [key, value] of queryParams) {
      let paramValue = reader.question("Enter the value for query parameter "+key+"(default="+value+"):") || value;

      if (!queryParamSignAdded) {
        serviceURL += queryParamSign;
        queryParamSignAdded = true;
      }
      serviceURL += key + "=" + paramValue;
      size--;
      if (size) {
        serviceURL += queryParamDelimit;
      }
    }
  `;
}

function getServiceUrlBlock (isSecure, authMethod, urlProtocol, urlHost, urlPath) {
  let httpProtocol = ``;
  let httpURL = ``;
  if (authMethod === "digest")
  {
    if (isSecure)
    {
      httpProtocol = `https`;
    }
    else
    {
      httpProtocol = `http`;
    }
    httpURL = `    serviceURLHttp = '` + httpProtocol + `://` + urlHost + urlPath + `';\n`;
  }
  return `
    // construct service URL
    serviceURL = '` + urlProtocol + `://` + urlHost + urlPath + `';\n` + httpURL;
}

function getWebSocketConnectionBlock (isSecure, authMethod) {
  let getAuthHeaderStr = ``;
  if (authMethod === "basic")
  {
    getAuthHeaderStr = `\n    auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');`;
  }
  if (authMethod === "digest")
  {
    let caCertStr = ``;
    if (isSecure)
    {
      caCertStr = `, ca: fs.readFileSync(caCert)`;
    }
    getAuthHeaderStr = `
    // Get digest auth nonce
    const promise = await new Promise((resolve, reject) => {
        const req = http.request(serviceURLHttp, {method: 'GET'` + caCertStr + `}, (res) => {
            let wwwAuthenticate = res.headers['www-authenticate'];
            auth = digest('GET', res.req.path, wwwAuthenticate, username + ':' + password);
            resolve();
        });
        req.end();
    });\n`
  }

  let authInit = ``;
  let authOption = ``;
  if (authMethod === "basic" || authMethod === "digest" )
  {
    authInit = `\n    let auth = "";`;
    authOption = `
      headers: {Authorization: auth}`;
    if (isSecure)
    {
      authOption = authOption + `,`;
    }
  }

  let keyCertOption = ``;
  if (isSecure)
  {
    keyCertOption = `
      key: fs.readFileSync(userKey),
      cert: fs.readFileSync(userCert),
      ca: fs.readFileSync(caCert)`;
  }

  return authInit + getAuthHeaderStr + `
    // establishing secure websocket connection to the service
    const options = {` + authOption + keyCertOption + ` 
    };
    const wsClient = new WebSocket(serviceURL, options);`;
}

function setQueryParam (channel, queryMap) {
  if (channel.bindings().has("ws")) {
    let ws_binding = channel.bindings().get("ws");
    const bindingPropIterator = Object.entries((ws_binding.json())["query"]["properties"]);

    for (const [propKey, propValue] of bindingPropIterator) {
      let sValue = propValue["default"];
      if (sValue) {
        queryMap.set(propKey, sValue);      
      }
      else {
        queryMap.set(propKey, '');      
      }
    }
  }
}

export default function({ asyncapi, params })
{
  if (asyncapi.components().isEmpty())
  {
    return null;
  }

  if (asyncapi.channels().isEmpty())
  {
    return null;
  }

  const lang = params.language;
  if (lang !== "all" && lang !== "javascript")
  {
    return null;
  }
    
  const server            = asyncapi.servers().get(params.server);
  const urlProtocol       = server.protocol();
  const urlHost           = server.host();
  const channels          = asyncapi.channels();
  let userFunction        = "processData";
  let urlPath             = "";
  let msgType             = "";
  let isSecure            = false;
  let isBasicAuth         = false;
  let queryMap            = new Map();
    
  if (urlProtocol === "wss") {
    isSecure = true;
  }
    
  const auth = params.authorization;
  if (auth !== "basic" && auth !== "digest" && auth !== "certificate")
  {
    throw new Error('the authorization method must be basic, digest or certificate');
  }

  if (channels.length !== 1) {
    throw new Error('only one channel allowed per streaming endpoint');
  }
    
  channels.forEach(channel=> {
    if (channel.operations().filterBySend().length > 0) {
      throw new Error('publish operation not supported in streaming client');
    }

    urlPath = channel.address();

    const messages = channel.messages();
    for (let i = 0; i < messages.length; i++) {
      if (i > 0) {
        console.log('only support one type of message');
        break;
      }
      msgType = messages[i].payload().type();
    }

    const operations = channel.operations();
    for (let i = 0; i < operations.length; i++) {
      if (i > 0) {
        console.log('only support one subscribe operation');
        break;
      }
      userFunction = operations[i].id();
    }

    setQueryParam(channel, queryMap);
  });

  let dataProcessBlock = getDataProcessingBlock(msgType);
  let userInputBlock = getUserInputBlock(isSecure, auth);
  let serviceUrlBlock = getServiceUrlBlock(isSecure, auth, urlProtocol, urlHost, urlPath);
  let queryParamBlock = getQueryParamBlock(queryMap); 
  let websocketConnectionBlock = getWebSocketConnectionBlock(isSecure, auth);

  let requireHttpPkg = `const http = require('node:http');\n`;
  if (isSecure)
  {
    requireHttpPkg = `const http = require('node:https');\n`;
  }

  return (
    <File name="client.js">
      {`//////////////////////////////////////////////////////////////////////
//
// ${asyncapi.info().title()} - ${asyncapi.info().version()}
// ${urlProtocol} protocol: 
// ${urlHost} 
// ${urlPath}
//////////////////////////////////////////////////////////////////////
const WebSocket = require('ws')
const reader = require('readline-sync');
const fs = require('fs');
const digest = require('digest-header');
`
+
requireHttpPkg
+          
`
//////////////////////////////////////////////////////////////////////
//
// This client demonstrates the one-way websocket streaming use case
// -- It assumes only one channel in the server!
// -- It assumes only 'subscribe' oepration in the channel!
// -- It supports query parameters such as ?begin=now&format=json
//
//////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
//
// generic data processing with the websocket service,
// assume an array of json objects.
//
////////////////////////////////////////////////////////////////
const ${userFunction} = (wsClient) => {
    wsClient.on('message', function message(data) {
        console.log('received some data:')
        const records = data.toString()
`+
 dataProcessBlock
 +
      `    
    });
    wsClient.on('error', (err) => {
        console.log(err.toString());
    });
}

////////////////////////////////////////////////////////////////
//
// main entry point for the example client:
// asyncapi yaml definition is parsed to provide service
// access URL and a dedicated websocket connection is
// created to stream data from the service.
//
////////////////////////////////////////////////////////////////

const init = async () =>{
`+
 userInputBlock
 +
 serviceUrlBlock
 +
 queryParamBlock
 +
      `
    console.log(" ");
    console.log("Establishing websocket connection to: ");
    // uncomment below for debugging
    console.log(serviceURL); 
    console.log(" ");
`+
 websocketConnectionBlock
 +
      `
    console.log(" ");
    console.log("Start streaming data from the service ...");
    console.log(" ");

    // now start the client processing    
    ${userFunction} (wsClient)
}

init()
`
      }
    </File>
  );
}
