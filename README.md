<h1 align="center">WebSocket Client template</h1>

<p align="center">
  <em>This is a websocket client template for the AsyncAPI generator</em>
</p>

[![AsyncAPI logo](./assets/github-repobanner-generic.png)](https://www.asyncapi.com)  



<!-- toc is generated with GitHub Actions do not remove toc markers -->

<!-- toc -->

- [Overview](#overview)
- [Technical requirements](#technical-requirements)
- [Specification requirements](#specification-requirements)
- [Supported protocols](#supported-protocols)
- [How to use the template](#how-to-use-the-template)
  * [Data Streaming Client](#data-streaming-client)
- [Template configuration](#template-configuration)
- [Development](#development)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

<!-- tocstop -->

## Overview

This template generates the following resources related to WebSockets streaming protocol:

- Client node-js script to connect and receive data from a websocket data streaming service
- Client python  script to connect and receive data from a websocket data streaming service

Other files are for the setup of developer environment, like `.editorconfig` or `.eslint`.

## Technical requirements

The Generator is a Node.js application. Therefore, this template also depends on Node.js. The generator's technical requirements are:

- Node.js v18.12.0+
- npm v8.19.0+

Install both using [official installer](https://nodejs.org/en/download/).

After that you can install the [AsyncAPI Generator](https://github.com/asyncapi/generator) globally to use its CLI:

```bash
npm install -g @asyncapi/generator
```

## Specification requirements

This is a very early version of the template and not all specification features are supported:

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

In case of one-way data streaming use case, A client program establishes the websocket connection with the specified service and starts to receive data in a streaming fashion. In this usage case, a single channel is assumed in the service configuration and only subscribe operation is supported for the channel. To generate the data streaming client, run the asyncapi generator against a websocket client API specification such as test/streaming.yaml:

```bash
# Install dependecies and the AsyncAPI Generator
npm install
npm install -g @asyncapi/generator

# Run generation,
# you need to customize the asyncapi yaml document with your actual server settings. 
ag test/streaming.yaml . -o output -p server=localhost
or
ag test/streaming.yaml @asyncapi/websocket-client-template -o output -p server=localhost

# Go to generated output folder, and install needed packages for client
cd output
npm install

##
## Start the client
##

# Optional: You can set environment variables for username/password or the location of certificate/key.
# For WS, use ASYNCAPI_WS_CLIENT_USERNAME and ASYNCAPI_WS_CLIENT_PASSWORD to specify the username and password accordingly. 
# For WSS, use ASYNCAPI_WS_CLIENT_CERT, ASYNCAPI_WS_CLIENT_KEY, and ASYNCAPI_WS_CA_CERT to specify the location of client certificate, client private key, or CA certificate.

# Excute the client and follow the instructions
node client.js
```

## Template configuration

You can configure this template by passing different parameters in the Generator CLI: `-p PARAM1_NAME=PARAM1_VALUE -p PARAM2_NAME=PARAM2_VALUE`

| Name | Description | Required | Default | Allowed Values | Example
|---|---|---|---|---|---|
|server|The server you want to use in the code.|Yes| - | Name of the server from the list of servers under Servers object | `localhost`|


## Development

The most straightforward command to use this template is:
```bash
ag test/streaming.yaml @asyncapi/websocket-client-template -o output -p server=localhost
```

For local development, you need different variations of this command. First of all, you need to know about the following important CLI flags:
- `--install` enforces reinstallation of the template.

There are two ways you can work on template development:
- Use global Generator and template from your local sources:
  ```bash
  # assumption is that you run this command from the root of your template
  ag test/streaming.yaml ./ -o output -p server=localhost
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
also reproduced in [LICENSE.md](./LICENSE.md)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.

See the License for the specific language governing permissions and
limitations under the License.
