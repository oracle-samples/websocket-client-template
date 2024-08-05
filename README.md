# WebSocket Client template

<p>
  <em>This is a websocket client template for the AsyncAPI generator</em>
</p>

[![AsyncAPI logo](./assets/github-repobanner-generic.png)](https://www.asyncapi.com)  



<!-- toc is generated with GitHub Actions do not remove toc markers -->

<!-- toc -->

- [Overview](#overview)
- [Technical requirements](#technical-requirements)
- [Documentation](#documentation)
- [Supported protocols](#supported-protocols)
- [How to use the template](#how-to-use-the-template)
  * [Data Streaming Client](#data-streaming-client)
- [Template configuration](#template-configuration)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

<!-- tocstop -->

## Overview

This template generates the following resources related to using WebSockets protocol with a data streaming service:

- Client application source code to connect and receive data from a data streaming service via dedicated websocket channel
- Client application build environment and dependency management depending on the client application language
- Client resource property files depending on the client application language

## Technical requirements

The AsyncAPI Generator is a Node.js application. Therefore, this template also depends on Node.js. The generator's technical requirements are:

- Node.js v18.12.0+
- npm v8.19.0+

Install both using [official installer](https://nodejs.org/en/download/).

After that you can install the [AsyncAPI Generator](https://github.com/asyncapi/generator) globally to use its CLI:

```bash
npm install -g @asyncapi/generator
```

## Documentation

This is a very early version of the template and limited specification features are supported:

Property name | Reason | Fallback | Default
---|---|---|---
`servers.*.url` | Template doesn't support variables in the server url. | - | -
`bindings` | Template doesn't fully use [websockets](https://github.com/asyncapi/bindings/tree/master/websockets) bindings.| - | -
`operationId` | Operation ID must be set for every operation to generate proper functions as there is no fallback in place | - | -

## Supported protocols

[WebSocket](https://en.wikipedia.org/wiki/WebSocket)

## How to use the template

This template must be used with the AsyncAPI Generator. You can find all available options [here](https://github.com/asyncapi/generator/).

### Data Streaming Client

In case of one-way data streaming use case, A client program establishes the websocket connection with the specified service and starts to receive data in a streaming fashion. In this usage case, a single channel is assumed in the service configuration and only subscribe operation is supported for the channel. To generate the data streaming client, run the asyncapi generator against a websocket client API specification such as the one included (test/streaming.yaml):

```bash
# Install dependecies and the AsyncAPI Generator
npm install
npm install -g @asyncapi/generator

###
### How to run the code generation,
### @note: you need to customize the asyncapi yaml document with your actual server settings.

cd /localdir/websocket-client-template/
ag test/streaming.yaml . -o output -p server=localhost -p authorization=basic 

or

ag test/streaming.yaml /localdir/websocket-client-template -o output -p server=localhost -p authorization=basic


###
### How to start the generated client
### @note: this is for the nodejs client, for other programming languages, check details in the client language section

# Go to the generated output folder, and install needed packages for client
cd output
npm install

##
## Start the client
##

# Optional: You can set environment variables for username/password or the location of certificate/key. Otherwise, follow the instructions to provide required information
# For WS, use ASYNCAPI_WS_CLIENT_USERNAME and ASYNCAPI_WS_CLIENT_PASSWORD to specify the username and password accordingly. 
# For WSS, use ASYNCAPI_WS_CLIENT_CERT, ASYNCAPI_WS_CLIENT_KEY, and ASYNCAPI_WS_CA_CERT to specify the location of client certificate, client private key, or CA certificate.
# Find more details in the authorization section. 

# Excute the client and follow the instructions
node client.js
```

## Template configuration

You can configure this template by passing different parameters in the Generator CLI: `-p PARAM1_NAME=PARAM1_VALUE -p PARAM2_NAME=PARAM2_VALUE`

| Name | Description | Required | Default | Allowed Values | Example
|---|---|---|---|---|---|
|server|The server you want to use in the code.|Yes| - | Name of the server from the list of servers under Servers object | `localhost`|
|language|The programming language of the client application you want to generate.|No| javascript | javascript/python/java/golang/all | `all`|
|authorization|The authorization method you want to use. Use basic or digest if the server is behind a proxy.|No| certificate | basic/digest/certificate | `basic`|

### Language Support
- JavaScript
  - use "-p language=javascript" option explicitly or ignore this option in the client code generation command line. By default, the javascipt client will be generated.
  - once the client code is generated <br>
&nbsp;&nbsp;&nbsp;&nbsp; cd output <br>
&nbsp;&nbsp;&nbsp;&nbsp; npm install <br>
&nbsp;&nbsp;&nbsp;&nbsp; node client.js <br>


- Python
  - use "-p language=python" option in the client code generation command line.
  - once the client code is generated <br>
&nbsp;&nbsp;&nbsp;&nbsp; cd output <br>
&nbsp;&nbsp;&nbsp;&nbsp; pip install -r requirements.txt<br>
&nbsp;&nbsp;&nbsp;&nbsp; python client.py <br>

- Java
  - use "-p language=java" option in the client code generation command line.
  - once the client code is generated <br>
&nbsp;&nbsp;&nbsp;&nbsp; cd output <br>
&nbsp;&nbsp;&nbsp;&nbsp; mvn package<br>
&nbsp;&nbsp;&nbsp;&nbsp; java -jar target/AsyncapiWebSocketClientEndpoint-1.0-SNAPSHOT.jar <br>

- all
  - use "-p language=all" option in the client code generation command line to generate  clients in all supported languages.  
  - follow above instructions to build and run the clients<br>



### Authentication and Authorization Support
- Basic Authentication and Authorization <br>
use "-p authorization=basic" option in the code generation command line to use the basicAuth mode in the generated client. The client will ask for the user credentials (username/password) or check for the environmeent variables ASYNCAPI_WS_CLIENT_USERNAME and ASYNCAPI_WS_CLIENT_PASSWORD. The generated client will then construct a basicAuth header field in the websocket connection request. <br><br>

- Digest Authentication and Authorization <br>
use "-p authorization=digest" option in the code generation command line to use the digeestAuth mode in the generated client. The client will ask for the user credentials (username/password) or check for the environmeent variables ASYNCAPI_WS_CLIENT_USERNAME and ASYNCAPI_WS_CLIENT_PASSWORD. The client will then construct a digestAuth header field in the websocket connection request. <br><br>

- x-Certificate Authentication and Authorization <br>
use "-p authorization=certificate" option in the code generation command line to use the certificate mode in the generated client. The generated client will ask for the locations of the certificate/key files. The client will then construct the sslContext needed with the given certificate/key files for the websocket connection request. <br><br>


When reverse proxy is used in the setup, only basicAuth or digestAuth are supported as authorization mode with the data streaming service. If the reverse proxy is in secure mode, you may also need to provide the client certificate information in order to authenticate with the reverse proxy.

## Development

The most straightforward command to use this template is:
```bash
ag test/streaming.yaml . -o output -p server=localhost -p language=python
```

For local development, you need different variations of this command. First of all, you need to know about the following important CLI flags:
- `--install` enforces reinstallation of the template.

There are two ways you can work on template development:
- Use global Generator and template from your local sources:
  ```bash
  # assumption is that you run this command from the root of your template
  ag test/streaming.yaml ./ -o output -p server=localhost -p authorization=digest -p language=python
  ```
- Use Generator from sources and template also from local sources. This approach enables more debugging options with awesome `console.log` in the Generator sources or even the Parser located in `node_modules` of the Generator:
  ```bash
  # assumption is that you run this command from the root of your template
  # assumption is that generator sources are cloned on the same level as the template
  ../generator/cli.js test/streaming.yaml ./ -o output -p server=localhost
  ```

## Contributing

This project welcomes contributions from the community. Before submitting a pull request, please [review our contribution guide](./CONTRIBUTING.md)

## Security

Please consult the [security guide](./SECURITY.md) for our responsible security vulnerability disclosure process

## License

You may not use the identified files except in compliance with the
Apache License, Version 2.0 (the "License.")

You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0.  A copy of the license is
also reproduced in [LICENSE.txt](./LICENSE.txt)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.

See the License for the specific language governing permissions and
limitations under the License.
