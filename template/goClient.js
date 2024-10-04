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
        var jsonArray []map[string]interface{}
        err = json.Unmarshal([]byte(message), &jsonArray)
        if err != nil {
            log.Println("Error parsing JSON: ", err)
        }
        log.Printf("received %d records", len(jsonArray))
        for _, obj := range jsonArray {
            jsonObj, err := json.Marshal(obj)
            if err != nil {
                log.Println("Error parsing JSON: ", err)
            }
            log.Printf("%s", jsonObj)
            //data processing, implement user logic here. 
        }
    `;
  }
  else {
    return ` 
        log.Printf("%s", message) 
        //data processing, implement user logic here. 
    `;	
  }
}

function getUserInputBlock (isSecure, authMethod) {

  let retStr = ``;

  if (authMethod === "basic" || authMethod === "digest")
  {
    retStr += `
    username, exist := os.LookupEnv("ASYNCAPI_WS_CLIENT_USERNAME")
    if !exist {
        fmt.Print("Enter the username for accessing the service: ")
        fmt.Scanln(&username)
    }

    password, exist := os.LookupEnv("ASYNCAPI_WS_CLIENT_PASSWORD")
    if !exist {
        fmt.Print("Enter the password for accessing the service: ")
        bytepw, err := term.ReadPassword(int(syscall.Stdin))
        if err != nil {
            log.Fatal(err)
        }
        password = string(bytepw)
        fmt.Println("")
    }

    if len(username) == 0 || len(password) == 0 {
        fmt.Println("username and password can not be empty")
        return
    }
    `;
  }


  if (isSecure) {
    retStr += `
    userCertPath, exist := os.LookupEnv("ASYNCAPI_WS_CLIENT_CERT")
    userKeyPath := ""
    if !exist {
        fmt.Print("Enter location of the client certificate (if applicable): ")
        fmt.Scanln(&userCertPath)
        if len(userCertPath) != 0 {
            userKeyPath, exist = os.LookupEnv("ASYNCAPI_WS_CLIENT_KEY")
            if !exist {
                fmt.Print("Enter location of the private key: ")
                fmt.Scanln(&userKeyPath)
            }
        }
    }

    caCertPath, exist := os.LookupEnv("ASYNCAPI_WS_CA_CERT")
    if !exist {
        fmt.Print("Enter location of the CA certificate (if applicable): ")
        fmt.Scanln(&caCertPath)
    }`;
  }
  else
  {
    if (authMethod === "certificate")
    {
      throw new Error('authorization using certificate is currently not supported for ws protocol, please set authorization as basic or digest');
    }
  }

  return retStr;
}

function getQueryParamBlock(queryMap) {
  let mapSize = queryMap.length;  
  let s1 ='\n    queryParams := url.Values{}';
  queryMap.forEach(function(value, key) {
    s1 += `\n    queryParams.Add("` + key + `", "` + value + `")`;
  })
    
  return s1+`\n
    for key := range queryParams {
        fmt.Print("Enter the value for query parameter " + key + "(default=" + queryParams.Get(key) + "):")
        var value string
        fmt.Scanln(&value)

        if len(value) != 0 {
            queryParams.Set(key, value)
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
    httpURL = `serviceURLHttp := url.URL{Scheme: "` + httpProtocol + `", Host: "` + urlHost + `", Path: "` + urlPath + `"}
    `;

  }
  return `
    // construct service URL
    serviceURL := url.URL{Scheme: "` + urlProtocol + `", Host: "` + urlHost + `", Path: "` + urlPath + `", RawQuery: queryParams.Encode()}
    ` + httpURL;
}

function getWebSocketConnectionBlock (isSecure, authMethod) {

  let getCertBlock = ``;
  if (isSecure)
  {
    getCertBlock = `
    tlsConfig := &tls.Config {}

    if len(caCertPath) != 0 {
        caCertFile, err := ioutil.ReadFile(caCertPath)
        if err != nil {
            log.Fatal(err)
        }
        caCertPool := x509.NewCertPool()
        caCertPool.AppendCertsFromPEM(caCertFile)
        tlsConfig.RootCAs = caCertPool
    }

    if len(userCertPath) != 0 && len(userKeyPath) != 0 {
        clientCertKeyFile, err := tls.LoadX509KeyPair(userCertPath, userKeyPath)
        if err != nil {
            log.Fatal(err)
        }
        tlsConfig.Certificates = []tls.Certificate{clientCertKeyFile}
    }
    `;
  }


  let getAuthHeaderStr = `
    extraHeader := http.Header{}
    `;
  if (authMethod === "basic")
  {
    getAuthHeaderStr += `
    extraHeader = http.Header{"Authorization": {"Basic " + base64.StdEncoding.EncodeToString([]byte(username + ":" + password))}}
    `;
  }
  if (authMethod === "digest")
  {
    let httpReqClient = `http`;
    let httpReqTLSConfig = ``;
    if (isSecure)
    {
      httpReqTLSConfig = `
    clientGetAuth := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: tlsConfig,
        },
    }`;
      httpReqClient = `clientGetAuth`;
    }
    getAuthHeaderStr += httpReqTLSConfig + ` 
    res, err := ` + httpReqClient + `.Get(serviceURLHttp.String())
    if err != nil {
        log.Fatal(err)
    }

    // get the challenge from a 401 response
    digestAuthField := res.Header.Get("WWW-Authenticate")
    if digestAuthField != "" {
        chal, _ := digest.ParseChallenge(digestAuthField)

        // use it to create credentials for the next request
        cred, _ := digest.Digest(chal, digest.Options{
            Username: username,
            Password: password,
            Method:   http.MethodGet,
        })

        extraHeader.Set("Authorization", cred.String())
    }
    `;
  }

  let websocketReq = `
    // establishing secure websocket connection to the service`;

  if (isSecure)
  {
    websocketReq = `
    dialer := websocket.Dialer{TLSClientConfig: tlsConfig,}
    connection, _, err := dialer.Dial(serviceURL.String(), extraHeader)
    `;
  }
  else
  {
    websocketReq =`
    connection, _, err := websocket.DefaultDialer.Dial(serviceURL.String(), extraHeader)
    `;
  }

  websocketReq += `
    if err != nil {
        log.Fatal("dial:", err)
    }
    defer connection.Close()
    `;

  return getCertBlock + getAuthHeaderStr + websocketReq; 
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
  if (lang !== "all" && lang !== "go")
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

  // unused imported package would be error
  let importPkg = `
    "fmt"
    "log"
    "net/url"
    "net/http"
    "os"
    "github.com/gorilla/websocket"`;

  if (auth !== "certificate")
  {
    importPkg += `
    "golang.org/x/term"
    "syscall"
    `
    if (auth === "basic")
    {
      importPkg += `
    "encoding/base64"
    `;
    }

    if (auth === "digest")
    {
      importPkg += `
    "github.com/icholy/digest"
    `;
    }
  }

  if (isSecure)
  {
    importPkg += `
    "crypto/x509"
    "crypto/tls"
    "io/ioutil"
    `;
  }

  if (msgType === "array")
  {
    importPkg += `
    "encoding/json"
    `;
  }

  return (
    <File name="client.go">
      {`//////////////////////////////////////////////////////////////////////
//
// ${asyncapi.info().title()} - ${asyncapi.info().version()}
// ${urlProtocol} protocol: 
// ${urlHost} 
// ${urlPath}
//
//////////////////////////////////////////////////////////////////////

package main

import (`
+
importPkg
+
`
)

`
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
func ${userFunction}(connection *websocket.Conn) {
    for {
        _, message, err := connection.ReadMessage()
        if err != nil {
            log.Fatal("ReadMessage error:", err)
        }
`+
 dataProcessBlock
 +
`    
    }
}

////////////////////////////////////////////////////////////////
//
// main entry point for the example client:
// asyncapi yaml definition is parsed to provide service
// access URL and a dedicated websocket connection is
// created to stream data from the service.
//
////////////////////////////////////////////////////////////////

func main() {

    // no datetime in log
    log.SetFlags(0)
`+
 userInputBlock
 +
 queryParamBlock
 +
 serviceUrlBlock
 +
      `
    fmt.Println(" ")
    fmt.Println("Establishing websocket connection to: ")
    // uncomment below for debugging
    fmt.Println(serviceURL.String()) 
    fmt.Println(" ")
`+
 websocketConnectionBlock
 +
      `
    fmt.Println(" ")
    fmt.Println("Start streaming data from the service ...")
    fmt.Println(" ")

    // now start the client processing    
    ${userFunction} (connection)
}
`
      }
    </File>
  );
}
