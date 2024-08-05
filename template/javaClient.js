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
            JsonArray jsonArray = Json.createReader(new StringReader(message)).readArray();
            System.out.println("< received " + jsonArray.size() + " records");
            for (int i = 0; i < jsonArray.size(); i++) {
                JsonObject jsonObject = jsonArray.getJsonObject(i);
                System.out.println(jsonObject.toString());
                //data processing, implement user logic here. 
            }
    `;
  }
  else {
    return ` 
            System.out.println(message);
            //data processing, implement user logic here. 
    `;	
  }
}

function getUserInputBlock (isSecure, authMethod) {

  let retStr = ``;

  let varInit = `
        Boolean caUsePEM = false;
        Boolean userCertUsePEM = false;
        String userCertPath = System.getenv("ASYNCAPI_WS_CLIENT_CERT");
        String userKeyPath = System.getenv("ASYNCAPI_WS_CLIENT_KEY");
        String userKeyStorePath = System.getenv("ASYNCAPI_WS_CLIENT_KEYSTORE");
        String userKeyStorePassword = System.getenv("ASYNCAPI_WS_CLIENT_KEYSTORE_PASSWORD");
        String caCertPath = System.getenv("ASYNCAPI_WS_CA_CERT");
        String trustStorePath = System.getenv("ASYNCAPI_WS_TRUSTSTORE");
        String trustStorePassword = System.getenv("ASYNCAPI_WS_TRUSTSTORE_PASSWORD"); 
      `;

  let getUserCertKey = `
        if (userKeyStorePath != null && userKeyStorePassword != null) {
            System.out.println("\\n ----- Using KeyStore file in ASYNCAPI_WS_CLIENT_KEYSTORE for client certificate/key ----- \\n");
        }
        else if (userCertPath != null && userKeyPath != null) {
            System.out.println("\\n ----- Using PEM files in ASYNCAPI_WS_CLIENT_CERT and ASYNCAPI_WS_CLIENT_KEY for client certificate/key ----- \\n");
        }
        else {
            System.out.print("Enter location of the KeyStore file for client certificate/key (if applicable): ");
            userKeyStorePath = scanner.nextLine();
            if (userKeyStorePath.isEmpty()) {
                System.out.print("Enter location of the PEM file for client certificate (if applicable): ");
                userCertPath = scanner.nextLine();
                if (!userCertPath.isEmpty()) {
                    System.out.print("Enter location of the PEM file for private key: ");
                    userKeyPath = scanner.nextLine();
                    userCertUsePEM = true;
                    System.out.println("\\n ----- Using PEM files for client certificate/key ----- \\n");
                }
                else {
                    System.out.println("\\n ----- Warning: No KeyStore or PEM file specified ----- \\n");
                }
            }
            else {
                Console console = System.console();
                char[] keyStorePasswordArray = console.readPassword("Enter password for the KeyStore: ");
                userKeyStorePassword = new String(keyStorePasswordArray);
                System.out.println("\\n ----- Using user specified KeyStore file for client certificate/key ----- \\n");
            }
        }
    `; 

  let getCACert = `
        if (trustStorePath != null && trustStorePassword != null) {
            System.out.println("\\n ----- Using TrustStore file in ASYNCAPI_WS_TRUSTSTORE for CA certificate ----- \\n");
        }
        else if (caCertPath != null) {
            System.out.println("\\n ----- Using PEM file in ASYNCAPI_WS_CA_CERT for CA certificate ----- \\n");
        }
        else {
            System.out.print("Enter location of the TrustStore file for CA certificate (if applicable): ");
            trustStorePath = scanner.nextLine();
            if (trustStorePath.isEmpty()) {
                System.out.print("Enter location of the PEM file for CA certificate (if applicable): ");
                caCertPath = scanner.nextLine();
                if (!caCertPath.isEmpty()) {
                    caUsePEM = true;
                    System.out.println("\\n ----- Using PEM file for CA certificate ----- \\n");
                }
                else {
                    System.out.println("\\n ----- Using TrustStore file in default location ----- \\n");
                }
            }
            else {
                Console console = System.console();
                char[] trustStorePasswordArray = console.readPassword("Enter password for the TrustStore: ");
                trustStorePassword = new String(trustStorePasswordArray);
                System.out.println("\\n ----- Using user specified TrustStore file for CA certificate ----- \\n");
            }
        }
    `;


  if (authMethod === "basic" ||  authMethod === "digest")
  {
    retStr += `
        String username = System.getenv("ASYNCAPI_WS_CLIENT_USERNAME");
        if (username == null) {
            System.out.print("Enter the username for accessing the service: ");
            username = scanner.nextLine();
        }

        String password = System.getenv("ASYNCAPI_WS_CLIENT_PASSWORD");
        if (password == null) {
            Console console = System.console();
            char[] passwordArray = console.readPassword("Enter the password for accessing the service: ");
            password = new String(passwordArray);
        }

        if (username.isEmpty() || password.isEmpty()) {
            System.out.println("username and password can not be empty");
            System.exit(1);
        }
        `;

    if (isSecure)
    {
      retStr += varInit + getUserCertKey + getCACert;
    }
  }
  else // authMethod === "certificate"
  {
    if (!isSecure)
    {
      throw new Error('authorization using certificate is currently not supported for ws protocol, please set authorization as basic or digest');
    }

    retStr += varInit + getUserCertKey + getCACert;
  }

  return retStr;
}

function getQueryParamBlock(queryMap) {
  let mapSize = queryMap.length;  
  let s1 =`\n        Map<String, String> queryParamsDefault = new HashMap<>();`;
  queryMap.forEach(function(value, key) {
    s1 += `\n        queryParamsDefault.put("` + key + `", "` + value + `");`;
  })
    
  return s1+`\n
        String queryParamSign = "?";
        String queryParamDelimit = "&";
        boolean queryParamSignAdded = false;
        int size = queryParamsDefault.size();

        for (String key: queryParamsDefault.keySet()) {
            String prompt = "Enter value for query parameter " + key + "(default=" + queryParamsDefault.get(key) + "):";
            System.out.print(prompt);
            String paramValue = scanner.nextLine();
            if (paramValue.isEmpty()) {
                paramValue = queryParamsDefault.get(key);
            }

            if (!queryParamSignAdded) {
                serviceURL += queryParamSign;
                queryParamSignAdded = true;
            }

            serviceURL += key + "=" + paramValue;
            size--;

            if (size > 0) {
                serviceURL += queryParamDelimit;
            }
        }`;
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
    httpURL = `        String serviceURLHttp = "` + httpProtocol + `://` + urlHost + urlPath + `";\n`;
  }
  return `
        // construct service URL
        String serviceURL = "` + urlProtocol + `://` + urlHost + urlPath + `";\n` + httpURL;
}

function getWebSocketConnectionBlock (isSecure, authMethod) {
  let retStr = ``;
  let createSSLContextStr = ``;
  let clientSetSSL = ``;
  if (isSecure)
  {
    createSSLContextStr = `
            // Create SSLContext
            KeyManager[] km = createKeyManager(userCertPath, userKeyPath, userKeyStorePath, userKeyStorePassword, userCertUsePEM);
            TrustManager[] tm = createTrustManager(caCertPath, trustStorePath, trustStorePassword, caUsePEM);
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(km, tm, null);
            SslEngineConfigurator sslEngineConfigurator = new SslEngineConfigurator(sslContext);
      `;

    clientSetSSL = `
            client.getProperties().put(ClientProperties.SSL_ENGINE_CONFIGURATOR, sslEngineConfigurator);`;
  }

  let createClientConfigStr = ``; 
  let sc = isSecure ? `, sslContext` : ``;
  let urlHttp = (authMethod === "digest") ? `serviceURLHttp` : `""`; 
  let useClientConfig = `null`;

  if (authMethod === "basic" || authMethod === "digest")
  {
    createClientConfigStr = `

            // Create header for basic/digest auth
            ClientEndpointConfig.Configurator configurator = new ClientConfigurator(username, password, ` + urlHttp + sc + `);
            ClientEndpointConfig clientConfig = ClientEndpointConfig.Builder.create().configurator(configurator).build();
    `;
    useClientConfig = "clientConfig";
  }

  retStr = `

        try {
            // Create instance of this class
            CountDownLatch latchLocal = new CountDownLatch(1);
            AsyncapiWebSocketClientEndpoint clientEndpoint = new AsyncapiWebSocketClientEndpoint();
            clientEndpoint.setLatch(latchLocal);
            ` + createSSLContextStr + createClientConfigStr + `
            ClientManager client = ClientManager.createClient();
            ` + clientSetSSL + `
            client.connectToServer(clientEndpoint, ` + useClientConfig + `, URI.create(serviceURL));
            latchLocal.await();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        `;
  return retStr;
}

function getClientConfigBlock(isSecure, authMethod) {
  if (authMethod === "certificate")
  {
    return ``;
  }

  let retStr = ``;
  let getAuthHeaderStr = ``;
  let digestAuthFuncStr = ``;
  if (authMethod === "basic")
  {
    getAuthHeaderStr = `
                String auth = username + ":" + password;
                String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
                headers.put("Authorization", List.of("Basic " + encodedAuth));
`;
  }
  if (authMethod === "digest")
  {
    getAuthHeaderStr = `
                String auth = getDigestAuthHeader();
                if (auth != null) {
                    headers.put("Authorization", List.of(auth));
                }`;

    let createClientStr = `
      CloseableHttpClient httpClient = HttpClients.createDefault();`;

    if (isSecure)
    {
      createClientStr = `
            CloseableHttpClient httpClient = HttpClients.custom().setSSLContext(sslContext).build();`;
    }

    digestAuthFuncStr = `
        
        /**
         * Create authorziation field in request header for digest authorization mode
         */
        private String getDigestAuthHeader() throws Exception {

            HttpGet httpGet = new HttpGet(serviceURLHttp);` + createClientStr + `
            CloseableHttpResponse response = httpClient.execute(httpGet);

            Header[] responseHeaders = response.getHeaders("www-authenticate");
            if (responseHeaders.length > 0) {
                DigestScheme digestScheme = new DigestScheme();
                digestScheme.processChallenge(responseHeaders[0]);
                HttpContext localContext = HttpClientContext.create();
                Header digestHeader = digestScheme.authenticate(new UsernamePasswordCredentials(username, password), httpGet, localContext);
                return digestHeader.getValue();
            }
            else {
                return null;
            }
        }
    `;
  }

  let sslContextInputAndConstructor = `
        /**
         * Constructor of class ClientConfigurator.
         *
         * @param username username for accessing the service
         * @param password password for accessing the service
         * @param url      url of the service 
         */
        public ClientConfigurator(String username, String password, String url) {`;
  if (isSecure)
  {
    sslContextInputAndConstructor = `
        private final SSLContext sslContext;

        /**
         * Constructor of class ClientConfigurator.
         *
         * @param username username for accessing the service
         * @param password password for accessing the service
         * @param url      url of the service 
         * @param sc       SSLContext to use
         */
        public ClientConfigurator(String username, String password, String url, SSLContext sc) {
            this.sslContext = sc;`;
  }

  retStr = `
    /**
     * Configure the request by intercepting the opening handshake.
     */
    public static class ClientConfigurator extends ClientEndpointConfig.Configurator {

        private final String username;
        private final String password;
        private final String serviceURLHttp; 
        ` + sslContextInputAndConstructor + `
            this.username = username;
            this.password = password;
            this.serviceURLHttp = url;
        }` + digestAuthFuncStr + `

        /**
         * This function is called right before sending a request.
         *
         * @param headers the headers of the request
         */
        @Override
        public void beforeRequest(Map<String, List<String>> headers) {
            try {` + getAuthHeaderStr + `
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    `;

  return retStr;
}

function getSSLContextBlock() {
  let retStr = ``;

  retStr = `
    /**
     * Create KeyManager object from PEM files or KeyStore file.
     *
     * @param userCertPath          user certificate PEM file location
     * @param userKeyPath           private key PEM file location
     * @param userKeyStorePath      KeyStore file location
     * @param userKeyStorePassword  KeyStore file password
     * @param userCertUsePEM        if using PEM file
     */
    private static KeyManager[] createKeyManager(String userCertPath, String userKeyPath, String userKeyStorePath, String userKeyStorePassword, Boolean userCertUsePEM) throws Exception {

        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        KeyManager[] km = null;

        if (!userCertUsePEM && userKeyStorePath != null && !userKeyStorePath.isEmpty()) {
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(new FileInputStream(userKeyStorePath), userKeyStorePassword.toCharArray());
            kmf.init(keyStore, userKeyStorePassword.toCharArray());
            km = kmf.getKeyManagers();
        }
        else if (userCertUsePEM && userCertPath != null && !userCertPath.isEmpty() && userKeyPath != null && !userKeyPath.isEmpty()) {
            // Load client certificate
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            InputStream is = new FileInputStream(userCertPath);
            X509Certificate userCert = (X509Certificate) cf.generateCertificate(is);

            // Load client key
            Scanner scanner = new Scanner(new File(userKeyPath));
            String content = scanner.useDelimiter("\\\\A").next();
            content = content.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\\n", "")
                .replace("\\r", "");
            byte[] decodedKey = Base64.getDecoder().decode(content);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decodedKey);
            KeyFactory ketFactory = KeyFactory.getInstance("RSA");
            PrivateKey userKey = ketFactory.generatePrivate(keySpec);

            // Init KeyStore
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null);
            keyStore.setKeyEntry("userCert", userKey, "password".toCharArray(), new Certificate[]{userCert});
            kmf.init(keyStore, "password".toCharArray());
            km = kmf.getKeyManagers();
        }

        return km;
    }

    /**
     * Create TrustManager object from PEM file or TrustStore file.
     *
     * @param caCertPath          CA certificate PEM file location
     * @param trustStorePath      TrustStore file location
     * @param trustStorePassword  TrustStore file password
     * @param caUsePEM            if using PEM file
     */
    private static TrustManager[] createTrustManager(String caCertPath, String trustStorePath, String trustStorePassword, Boolean caUsePEM) throws Exception {

        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        TrustManager[] tm = null;

        if (!caUsePEM && trustStorePath != null && !trustStorePath.isEmpty()) {
            KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
            trustStore.load(new FileInputStream(trustStorePath), trustStorePassword.toCharArray());
            tmf.init(trustStore);
            tm = tmf.getTrustManagers();
        }
        else if (caUsePEM && caCertPath != null && !caCertPath.isEmpty()) {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            InputStream is = new FileInputStream(caCertPath);
            X509Certificate caCert = (X509Certificate) cf.generateCertificate(is);

            KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
            trustStore.load(null);
            trustStore.setCertificateEntry("caCert", caCert);
            tmf.init(trustStore);
            tm = tmf.getTrustManagers();
        }

        return tm;
    }
    `;
  return retStr;
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
  if (lang !== "all" && lang !== "java")
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
  let clientConfigBlock = getClientConfigBlock(isSecure, auth);
  let sslContextBlock = isSecure ? getSSLContextBlock() : ``;

  let httpLib = ``;
  if (auth === "digest")
  {
    httpLib = `
import org.apache.http.Header;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.protocol.HttpContext;
`;
  }

  let securityLib = ``;
  if (isSecure)
  {
    securityLib = `import org.glassfish.tyrus.client.SslEngineConfigurator;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.KeyManager;
import javax.net.ssl.KeyManagerFactory;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.KeyStore;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.cert.CertificateFactory;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
`;
  }

  return (
    <File name="AsyncapiWebSocketClientEndpoint.java">
      {`//////////////////////////////////////////////////////////////////////
//
// ${asyncapi.info().title()} - ${asyncapi.info().version()}
// ${urlProtocol} protocol: 
// ${urlHost} 
// ${urlPath}
//////////////////////////////////////////////////////////////////////
`
+
`
package asyncapi.websocket.client.template;

import jakarta.websocket.Session;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.ClientEndpointConfig;
import jakarta.websocket.CloseReason;
import jakarta.websocket.MessageHandler;

import java.net.URI;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Scanner;
import java.util.concurrent.CountDownLatch;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;

import java.io.StringReader;
import java.io.Console;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.File;

import org.glassfish.tyrus.client.ClientManager;
import org.glassfish.tyrus.client.ClientProperties;
`
+
securityLib
+
httpLib
+          
`

/**
 * WebSocket client establishing connection to stream data from the service 
 * specified in asyncapi yaml definition.
 *
 * <p>
 * This client demonstrates the one-way websocket streaming use case
 * <ul>
 * <li> It assumes only one channel in the server
 * <li> It assumes only 'subscribe' oepration in the channel
 * <li> It supports query parameters such as ?begin=now{@literal &}format=json
 * </ul>
 */
public class AsyncapiWebSocketClientEndpoint extends Endpoint {
    
    private Session session;
    private CountDownLatch latch;

    /**
     * This function is called when a new connection has just begun.
     */
    @Override
    public void onOpen(Session session, EndpointConfig config) {
        this.session = session;
        System.out.println("start streaming data from the service: " + session.getRequestURI());
        session.addMessageHandler(new MyMessageHandler());
    }

    /**
     * This function is called immediately prior to the session with the remote peer being closed.
     */
    @Override
    public void onClose(Session session, CloseReason closeReason) {
        System.out.println("Session closed because of " + closeReason);
        this.session = null;
        latch.countDown();
    }

    /**
     * This function is called when there is error in the connection.
     */
    @Override
    public void onError(Session session, Throwable throwable) {
        throwable.printStackTrace();
        latch.countDown();
    }

    /**
     * Class for handling messages.
     */
    public static class MyMessageHandler implements MessageHandler.Whole<String> {

        /**
         * This function is called when the message has been fully received.
         *
         * @param message the message data
         */
        @Override
        public void onMessage(String message) {
`
 +
 dataProcessBlock 
 +
`
        }
    }

    /**
     * Set the latch to prevent exiting right after connection established.
     *
     * @param latch the latch to set
     */
    public void setLatch(CountDownLatch latch) {
        this.latch = latch;
    }

    /**
     * Main entry point of this class.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);
`+
 userInputBlock
 +
 serviceUrlBlock
 +
 queryParamBlock
 +
 websocketConnectionBlock
 +
`
    }
`
 +
clientConfigBlock
 +
sslContextBlock
 +
`
}
`
      }
    </File>
  );
}
